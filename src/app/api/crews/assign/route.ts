import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assignCrewSchema = z.object({
  crewId: z.string(),
  jobId: z.string(),
  location: z.enum(["FIELD", "SHOP"]),
  action: z.enum(["assign", "unassign", "reassign"]).default("assign"),
});

const bulkAssignSchema = z.object({
  assignments: z.array(
    z.object({
      crewId: z.string(),
      jobId: z.string(),
      location: z.enum(["FIELD", "SHOP"]),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle bulk assignments
    if (body.assignments && Array.isArray(body.assignments)) {
      const { assignments } = bulkAssignSchema.parse(body);

      const results = await Promise.all(
        assignments.map(async (assignment) => {
          const existing = await prisma.crewAssignment.findUnique({
            where: {
              jobId_crewId: {
                jobId: assignment.jobId,
                crewId: assignment.crewId,
              },
            },
          });

          if (existing) {
            return prisma.crewAssignment.update({
              where: { id: existing.id },
              data: {
                location: assignment.location,
                active: true,
                assignedAt: new Date(),
              },
              include: {
                crew: {
                  include: {
                    foreman: true,
                    members: {
                      include: { user: true },
                      where: { active: true },
                    },
                  },
                },
                job: true,
              },
            });
          } else {
            return prisma.crewAssignment.create({
              data: {
                crewId: assignment.crewId,
                jobId: assignment.jobId,
                location: assignment.location,
                active: true,
              },
              include: {
                crew: {
                  include: {
                    foreman: true,
                    members: {
                      include: { user: true },
                      where: { active: true },
                    },
                  },
                },
                job: true,
              },
            });
          }
        })
      );

      return NextResponse.json({
        success: true,
        message: `${assignments.length} crew assignments updated`,
        assignments: results,
      });
    }

    // Handle single assignment
    const { crewId, jobId, location, action } = assignCrewSchema.parse(body);

    if (action === "unassign") {
      const assignment = await prisma.crewAssignment.findUnique({
        where: {
          jobId_crewId: { jobId, crewId },
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Assignment not found" },
          { status: 404 }
        );
      }

      await prisma.crewAssignment.update({
        where: { id: assignment.id },
        data: { active: false },
      });

      return NextResponse.json({
        success: true,
        message: "Crew unassigned successfully",
      });
    }

    // Handle assign or reassign
    const existing = await prisma.crewAssignment.findUnique({
      where: {
        jobId_crewId: { jobId, crewId },
      },
    });

    let assignment;

    if (existing) {
      // Update existing assignment (reassign)
      assignment = await prisma.crewAssignment.update({
        where: { id: existing.id },
        data: {
          location,
          active: true,
          assignedAt: new Date(),
        },
        include: {
          crew: {
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
            },
          },
          job: {
            select: { id: true, name: true, title: true, client: true, status: true },
          },
        },
      });
    } else {
      // Create new assignment
      assignment = await prisma.crewAssignment.create({
        data: {
          crewId,
          jobId,
          location,
          active: true,
        },
        include: {
          crew: {
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
            },
          },
          job: {
            select: { id: true, name: true, title: true, client: true, status: true },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: action === "reassign" ? "Crew reassigned successfully" : "Crew assigned successfully",
      assignment,
    });
  } catch (error) {
    console.error("Crew assignment error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process crew assignment" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const crewId = searchParams.get("crewId");
    const active = searchParams.get("active");

    const where: any = {};

    if (jobId) where.jobId = jobId;
    if (crewId) where.crewId = crewId;
    if (active !== null) where.active = active === "true";

    const assignments = await prisma.crewAssignment.findMany({
      where,
      include: {
        crew: {
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
          },
        },
        job: {
          select: { id: true, name: true, title: true, client: true, status: true, location: true },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error("Failed to fetch crew assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch crew assignments" },
      { status: 500 }
    );
  }
}