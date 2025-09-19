import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, validateRequest } from "@/lib/api-utils";

const selectJobSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  location: z.enum(["FIELD", "SHOP"], {
    errorMap: () => ({ message: "Location must be either FIELD or SHOP" })
  })
});

export async function POST(request: NextRequest) {
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

    // Validate request body
    const validation = await validateRequest(request, selectJobSchema);
    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const { jobId, location } = validation.data;

    // Check if job exists and is active
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        status: "ACTIVE"
      }
    });

    if (!job) {
      return apiError("Job not found or not active", 404);
    }

    // Check if user is already assigned to this job
    let crewAssignment = await prisma.crewAssignment.findFirst({
      where: {
        jobId,
        userId: user.id
      },
      include: {
        job: {
          select: {
            id: true,
            name: true,
            description: true,
            location: true
          }
        }
      }
    });

    if (crewAssignment) {
      // Update existing assignment
      crewAssignment = await prisma.crewAssignment.update({
        where: { id: crewAssignment.id },
        data: {
          location,
          status: "ACTIVE"
        },
        include: {
          job: {
            select: {
              id: true,
              name: true,
              description: true,
              location: true
            }
          }
        }
      });
    } else {
      // Create new assignment
      crewAssignment = await prisma.crewAssignment.create({
        data: {
          jobId,
          userId: user.id,
          location,
          status: "ACTIVE"
        },
        include: {
          job: {
            select: {
              id: true,
              name: true,
              description: true,
              location: true
            }
          }
        }
      });
    }

    return apiSuccess(
      {
        assignment: crewAssignment,
        sessionData: {
          jobId: crewAssignment.jobId,
          jobName: crewAssignment.job.name,
          location: crewAssignment.location,
          assignedAt: crewAssignment.assignedAt.toISOString()
        }
      },
      "Job selected successfully"
    );
  } catch (error) {
    console.error("Error selecting job:", error);
    return apiError("Failed to select job", 500);
  }
}