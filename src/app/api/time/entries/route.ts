import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Authentication required", 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const jobId = searchParams.get("jobId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const userId = session.user.id;

    const where: any = {
      userId,
    };

    // Filter by status
    if (status === "active") {
      where.clockOut = null;
    } else if (status === "completed") {
      where.clockOut = { not: null };
    }

    // Filter by job
    if (jobId) {
      where.jobId = jobId;
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        clockIn: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.timeEntry.count({ where });

    return apiSuccess({
      entries: timeEntries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Time entries API error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST() {
  return apiError("Use /api/time/clock for time entry operations", 405);
}