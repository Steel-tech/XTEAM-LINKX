import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const upcoming = searchParams.get("upcoming"); // Get upcoming reminders

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Calculate reminder threshold (next 24 hours for upcoming reminders)
    const now = new Date();
    const reminderThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find events with reminders that the user should be notified about
    const events = await prisma.calendarEvent.findMany({
      where: {
        reminder: true,
        date: {
          gte: now,
          ...(upcoming && { lte: reminderThreshold }),
        },
        OR: [
          {
            // User is in attendees list
            attendees: {
              contains: userId,
            },
          },
          {
            // User is a member of the job
            job: {
              members: {
                some: {
                  userId: userId,
                },
              },
            },
          },
        ],
      },
      include: {
        job: {
          select: {
            id: true,
            name: true,
            title: true,
            client: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Calculate reminder times and filter based on reminder minutes
    const reminders = events
      .map((event) => {
        const eventDate = new Date(event.date);
        const reminderMinutes = event.reminderMinutes || 15;
        const reminderTime = new Date(eventDate.getTime() - reminderMinutes * 60 * 1000);

        return {
          ...event,
          reminderTime,
          attendees: typeof event.attendees === "string"
            ? JSON.parse(event.attendees)
            : event.attendees,
          shouldNotify: reminderTime <= now && eventDate > now,
        };
      })
      .filter((reminder) =>
        upcoming ? reminder.reminderTime <= reminderThreshold : reminder.shouldNotify
      );

    return NextResponse.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch reminders",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, userId, type = "EMAIL" } = body;

    // This would typically send an email or push notification
    // For now, we'll just log the reminder
    console.log(`Sending ${type} reminder for event ${eventId} to user ${userId}`);

    // In a real implementation, you would:
    // 1. Get user's email/device token
    // 2. Send email via service like SendGrid, AWS SES, etc.
    // 3. Send push notification via Firebase, OneSignal, etc.
    // 4. Log the notification in a notifications table

    return NextResponse.json({
      success: true,
      message: "Reminder sent successfully",
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send reminder",
      },
      { status: 500 }
    );
  }
}