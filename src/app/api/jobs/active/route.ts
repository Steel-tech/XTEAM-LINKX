import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return apiError("Unauthorized", 401);
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    // Get active jobs
    const activeJobs = await prisma.job.findMany({
      where: {
        status: "ACTIVE"
      },
      include: {
        crewAssignments: {
          where: {
            userId: user.id
          },
          select: {
            id: true,
            location: true,
            status: true,
            assignedAt: true
          }
        },
        _count: {
          select: {
            crewAssignments: true
          }
        }
      },
      orderBy: {
        startDate: "asc"
      }
    });

    return apiSuccess(activeJobs, "Active jobs retrieved successfully");
  } catch (error) {
    console.error("Error fetching active jobs:", error);
    return apiError("Failed to fetch active jobs", 500);
  }
}