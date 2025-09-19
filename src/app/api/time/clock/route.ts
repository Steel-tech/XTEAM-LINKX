import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, validateRequest } from "@/lib/api-utils";
import { auth } from "@/lib/auth";

const clockInSchema = z.object({
  action: z.literal("clockIn"),
  jobId: z.string().min(1, "Job ID is required"),
  location: z.enum(["FIELD", "SHOP"]),
  notes: z.string().optional(),
});

const clockOutSchema = z.object({
  action: z.literal("clockOut"),
  timeEntryId: z.string().min(1, "Time entry ID is required"),
  notes: z.string().optional(),
});

const timeClockSchema = z.union([clockInSchema, clockOutSchema]);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Authentication required", 401);
    }

    const validation = await validateRequest(request, timeClockSchema);
    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const data = validation.data;
    const userId = session.user.id;

    if (data.action === "clockIn") {
      // Check if user already has an active time entry
      const activeEntry = await prisma.timeEntry.findFirst({
        where: {
          userId,
          clockOut: null,
        },
      });

      if (activeEntry) {
        return apiError("You are already clocked in. Please clock out first.", 400);
      }

      // Verify the job exists and user is assigned to it
      const job = await prisma.job.findUnique({
        where: { id: data.jobId },
      });

      if (!job) {
        return apiError("Job not found", 404);
      }

      // Check if user is assigned to this job
      const crewAssignment = await prisma.crewAssignment.findFirst({
        where: {
          jobId: data.jobId,
          userId,
          status: "ACTIVE",
        },
      });

      if (!crewAssignment) {
        return apiError("You are not assigned to this job", 403);
      }

      // Create new time entry
      const timeEntry = await prisma.timeEntry.create({
        data: {
          userId,
          jobId: data.jobId,
          location: data.location,
          clockIn: new Date(),
          notes: data.notes,
        },
        include: {
          job: true,
        },
      });

      return apiSuccess(timeEntry, "Clocked in successfully");
    } else {
      // Clock out
      const timeEntry = await prisma.timeEntry.findUnique({
        where: { id: data.timeEntryId },
      });

      if (!timeEntry) {
        return apiError("Time entry not found", 404);
      }

      if (timeEntry.userId !== userId) {
        return apiError("Unauthorized access to time entry", 403);
      }

      if (timeEntry.clockOut) {
        return apiError("This time entry is already closed", 400);
      }

      const clockOut = new Date();
      const duration = Math.floor((clockOut.getTime() - timeEntry.clockIn.getTime()) / (1000 * 60)); // minutes

      const updatedEntry = await prisma.timeEntry.update({
        where: { id: data.timeEntryId },
        data: {
          clockOut,
          duration,
          notes: data.notes ?
            (timeEntry.notes ? `${timeEntry.notes}\n${data.notes}` : data.notes) :
            timeEntry.notes,
        },
        include: {
          job: true,
        },
      });

      return apiSuccess(updatedEntry, "Clocked out successfully");
    }
  } catch (error) {
    console.error("Time clock API error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function GET() {
  return apiError("Method not allowed", 405);
}