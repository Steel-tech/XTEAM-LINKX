import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createEventSchema = z.object({
  jobId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().datetime("Invalid date format"),
  endDate: z.string().datetime("Invalid end date format").optional(),
  type: z.enum(["MEETING", "INSPECTION", "DEADLINE", "TASK", "REMINDER"]),
  location: z.enum(["FIELD", "SHOP", "OFFICE"]).optional(),
  attendees: z.array(z.string()).default([]),
  reminder: z.boolean().default(false),
  reminderMinutes: z.number().min(0).optional(),
  allDay: z.boolean().default(false),
});

const updateEventSchema = createEventSchema.partial().extend({
  id: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    let whereClause: any = {};

    if (jobId) {
      whereClause.jobId = jobId;
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (type) {
      whereClause.type = type;
    }

    const events = await prisma.calendarEvent.findMany({
      where: whereClause,
      include: {
        job: {
          select: {
            id: true,
            name: true,
            title: true,
            client: true,
            status: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Parse attendees JSON string back to array
    const formattedEvents = events.map((event) => ({
      ...event,
      attendees: typeof event.attendees === "string"
        ? JSON.parse(event.attendees)
        : event.attendees,
    }));

    return NextResponse.json({
      success: true,
      data: formattedEvents,
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch calendar events",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createEventSchema.parse(body);

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: validatedData.jobId },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 }
      );
    }

    // Create calendar event
    const event = await prisma.calendarEvent.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        attendees: JSON.stringify(validatedData.attendees),
      },
      include: {
        job: {
          select: {
            id: true,
            name: true,
            title: true,
            client: true,
            status: true,
          },
        },
      },
    });

    // Parse attendees back to array for response
    const formattedEvent = {
      ...event,
      attendees: JSON.parse(event.attendees),
    };

    return NextResponse.json({
      success: true,
      data: formattedEvent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Error creating calendar event:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create calendar event",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateEventSchema.parse(body);
    const { id, ...updateData } = validatedData;

    // Check if event exists
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
        },
        { status: 404 }
      );
    }

    // Prepare update data
    const dataToUpdate: any = { ...updateData };

    if (updateData.date) {
      dataToUpdate.date = new Date(updateData.date);
    }

    if (updateData.endDate) {
      dataToUpdate.endDate = new Date(updateData.endDate);
    }

    if (updateData.attendees) {
      dataToUpdate.attendees = JSON.stringify(updateData.attendees);
    }

    // Update calendar event
    const event = await prisma.calendarEvent.update({
      where: { id },
      data: dataToUpdate,
      include: {
        job: {
          select: {
            id: true,
            name: true,
            title: true,
            client: true,
            status: true,
          },
        },
      },
    });

    // Parse attendees back to array for response
    const formattedEvent = {
      ...event,
      attendees: JSON.parse(event.attendees),
    };

    return NextResponse.json({
      success: true,
      data: formattedEvent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Error updating calendar event:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update calendar event",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Event ID is required",
        },
        { status: 400 }
      );
    }

    // Check if event exists
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
        },
        { status: 404 }
      );
    }

    // Delete calendar event
    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete calendar event",
      },
      { status: 500 }
    );
  }
}