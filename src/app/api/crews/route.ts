import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCrewSchema = z.object({
  name: z.string().min(1, "Crew name is required"),
  type: z.enum(["FIELD", "SHOP"]),
  foremanId: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

const updateCrewSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["FIELD", "SHOP"]).optional(),
  foremanId: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const active = searchParams.get("active");
    const includePerformance = searchParams.get("includePerformance") === "true";

    const where: any = {};
    if (type) where.type = type;
    if (active !== null) where.active = active === "true";

    const crews = await prisma.crew.findMany({
      where,
      include: {
        foreman: {
          select: { id: true, name: true, email: true, role: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true, location: true },
            },
          },
          where: { active: true },
        },
        assignments: includePerformance
          ? {
              include: {
                job: {
                  select: { id: true, name: true, client: true, status: true },
                },
              },
              where: { active: true },
            }
          : {
              where: { active: true },
              select: { id: true, location: true, assignedAt: true },
            },
      },
      orderBy: { name: "asc" },
    });

    // Calculate performance metrics if requested
    const crewsWithMetrics = includePerformance
      ? crews.map((crew) => ({
          ...crew,
          metrics: {
            activeJobs: crew.assignments.length,
            memberCount: crew.members.length,
            availability: crew.assignments.length === 0 ? "available" : "assigned",
            currentAssignments: crew.assignments.map((a) => ({
              jobName: a.job?.name,
              location: a.location,
              assignedAt: a.assignedAt,
            })),
          },
        }))
      : crews;

    return NextResponse.json({
      success: true,
      crews: crewsWithMetrics,
    });
  } catch (error) {
    console.error("Failed to fetch crews:", error);
    return NextResponse.json(
      { error: "Failed to fetch crews" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, foremanId, memberIds } = createCrewSchema.parse(body);

    // Verify foreman exists and has appropriate role
    if (foremanId) {
      const foreman = await prisma.user.findUnique({
        where: { id: foremanId },
      });

      if (!foreman || !["FOREMAN", "PM", "ADMIN"].includes(foreman.role)) {
        return NextResponse.json(
          { error: "Invalid foreman selection" },
          { status: 400 }
        );
      }
    }

    // Create the crew
    const crew = await prisma.crew.create({
      data: {
        name,
        type,
        foremanId,
        active: true,
      },
    });

    // Add members if provided
    if (memberIds && memberIds.length > 0) {
      await prisma.crewMember.createMany({
        data: memberIds.map((userId) => ({
          crewId: crew.id,
          userId,
          active: true,
        })),
      });
    }

    // Fetch the complete crew with relationships
    const createdCrew = await prisma.crew.findUnique({
      where: { id: crew.id },
      include: {
        foreman: {
          select: { id: true, name: true, email: true, role: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          where: { active: true },
        },
        assignments: {
          where: { active: true },
          include: {
            job: {
              select: { id: true, name: true, client: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Crew created successfully",
      crew: createdCrew,
    });
  } catch (error) {
    console.error("Failed to create crew:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create crew" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("id");

    if (!crewId) {
      return NextResponse.json(
        { error: "Crew ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData = updateCrewSchema.parse(body);

    // Verify crew exists
    const existingCrew = await prisma.crew.findUnique({
      where: { id: crewId },
    });

    if (!existingCrew) {
      return NextResponse.json(
        { error: "Crew not found" },
        { status: 404 }
      );
    }

    // Verify foreman if provided
    if (updateData.foremanId) {
      const foreman = await prisma.user.findUnique({
        where: { id: updateData.foremanId },
      });

      if (!foreman || !["FOREMAN", "PM", "ADMIN"].includes(foreman.role)) {
        return NextResponse.json(
          { error: "Invalid foreman selection" },
          { status: 400 }
        );
      }
    }

    // Update the crew
    const updatedCrew = await prisma.crew.update({
      where: { id: crewId },
      data: updateData,
      include: {
        foreman: {
          select: { id: true, name: true, email: true, role: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          where: { active: true },
        },
        assignments: {
          where: { active: true },
          include: {
            job: {
              select: { id: true, name: true, client: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Crew updated successfully",
      crew: updatedCrew,
    });
  } catch (error) {
    console.error("Failed to update crew:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update crew" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("id");

    if (!crewId) {
      return NextResponse.json(
        { error: "Crew ID is required" },
        { status: 400 }
      );
    }

    // Check if crew has active assignments
    const activeAssignments = await prisma.crewAssignment.count({
      where: { crewId, active: true },
    });

    if (activeAssignments > 0) {
      return NextResponse.json(
        { error: "Cannot delete crew with active job assignments" },
        { status: 400 }
      );
    }

    // Soft delete by marking as inactive
    await prisma.crew.update({
      where: { id: crewId },
      data: { active: false },
    });

    // Also mark crew members as inactive
    await prisma.crewMember.updateMany({
      where: { crewId },
      data: { active: false },
    });

    return NextResponse.json({
      success: true,
      message: "Crew deactivated successfully",
    });
  } catch (error) {
    console.error("Failed to delete crew:", error);
    return NextResponse.json(
      { error: "Failed to delete crew" },
      { status: 500 }
    );
  }
}