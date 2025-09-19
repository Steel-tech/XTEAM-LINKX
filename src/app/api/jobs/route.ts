import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const includeCrews = searchParams.get("includeCrews") === "true";

    // Check if user is admin/PM (can see all jobs) or regular user (only assigned jobs)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAdmin = user?.role && ["ADMIN", "PM"].includes(user.role);

    let jobs;

    if (isAdmin) {
      // Admin/PM can see all jobs
      const where: any = {};
      if (status) where.status = status;

      jobs = await prisma.job.findMany({
        where,
        include: includeCrews ? {
          crews: {
            where: { active: true },
            include: {
              crew: {
                select: { id: true, name: true, type: true },
              },
            },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
          _count: {
            select: {
              crews: { where: { active: true } },
              members: true,
              messages: true,
            },
          },
        } : undefined,
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Regular users see only assigned jobs
      const jobMemberships = await prisma.jobMember.findMany({
        where: {
          userId: session.user.id,
          ...(status ? { job: { status } } : {}),
        },
        include: {
          job: {
            include: includeCrews ? {
              crews: {
                where: { active: true },
                include: {
                  crew: {
                    select: { id: true, name: true, type: true },
                  },
                },
              },
              members: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true, role: true },
                  },
                },
              },
              _count: {
                select: {
                  crews: { where: { active: true } },
                  members: true,
                  messages: true,
                },
              },
            } : {
              select: {
                id: true,
                name: true,
                title: true,
                client: true,
                description: true,
                location: true,
                status: true,
                priority: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        orderBy: {
          job: {
            createdAt: "desc",
          },
        },
      });

      jobs = jobMemberships.map((membership) => membership.job);
    }

    return NextResponse.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}