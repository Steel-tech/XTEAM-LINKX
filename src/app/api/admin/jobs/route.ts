import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has admin or PM role (from session)
    if (!session.user.role || !["ADMIN", "PM"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Admin or PM role required." },
        { status: 403 }
      );
    }

    // Fetch all active jobs with crew assignments and real-time progress
    const jobs = await prisma.job.findMany({
      where: {
        status: "ACTIVE"
      },
      include: {
        crews: {
          where: { active: true },
          include: {
            crew: {
              include: {
                foreman: {
                  select: { id: true, name: true, email: true, location: true }
                },
                members: {
                  where: { active: true },
                  include: {
                    user: {
                      select: { id: true, name: true, email: true, location: true }
                    }
                  }
                }
              }
            }
          }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        messages: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        events: {
          where: {
            date: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
            }
          },
          orderBy: { date: "asc" }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Transform data for frontend consumption
    const jobsWithProgress = jobs.map(job => {
      // Calculate crew statistics
      const fieldCrews = job.crews.filter(ca => ca.location === "FIELD");
      const shopCrews = job.crews.filter(ca => ca.location === "SHOP");

      const totalFieldWorkers = fieldCrews.reduce((acc, ca) =>
        acc + ca.crew.members.filter(m => m.active).length, 0
      );

      const totalShopWorkers = shopCrews.reduce((acc, ca) =>
        acc + ca.crew.members.filter(m => m.active).length, 0
      );

      // Get recent activity
      const recentMessages = job.messages.slice(0, 3);
      const upcomingEvents = job.events.slice(0, 3);

      // Calculate progress indicators (could be enhanced with actual metrics)
      const progressIndicators = {
        fieldProgress: Math.floor(Math.random() * 100), // Placeholder
        shopProgress: Math.floor(Math.random() * 100),  // Placeholder
        onSchedule: Math.random() > 0.3, // Placeholder
        budgetStatus: Math.random() > 0.2 ? "on-track" : "over-budget"
      };

      return {
        id: job.id,
        name: job.name,
        title: job.title,
        client: job.client,
        location: job.location,
        status: job.status,
        priority: job.priority,
        startDate: job.startDate,
        endDate: job.endDate,
        fieldCrews: fieldCrews.map(ca => ({
          id: ca.id,
          name: ca.crew.name,
          foreman: ca.crew.foreman,
          memberCount: ca.crew.members.filter(m => m.active).length,
          members: ca.crew.members
            .filter(m => m.active)
            .map(m => ({
              id: m.user.id,
              name: m.user.name,
              location: m.user.location
            }))
        })),
        shopCrews: shopCrews.map(ca => ({
          id: ca.id,
          name: ca.crew.name,
          foreman: ca.crew.foreman,
          memberCount: ca.crew.members.filter(m => m.active).length,
          members: ca.crew.members
            .filter(m => m.active)
            .map(m => ({
              id: m.user.id,
              name: m.user.name,
              location: m.user.location
            }))
        })),
        totalFieldWorkers,
        totalShopWorkers,
        recentActivity: recentMessages.map(msg => ({
          id: msg.id,
          content: msg.content.substring(0, 100) + (msg.content.length > 100 ? "..." : ""),
          sender: msg.sender.name,
          createdAt: msg.createdAt
        })),
        upcomingEvents: upcomingEvents.map(event => ({
          id: event.id,
          title: event.title,
          date: event.date,
          type: event.type
        })),
        progressIndicators,
        lastUpdated: job.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobsWithProgress,
        summary: {
          totalActiveJobs: jobs.length,
          totalFieldWorkers: jobsWithProgress.reduce((acc, job) => acc + job.totalFieldWorkers, 0),
          totalShopWorkers: jobsWithProgress.reduce((acc, job) => acc + job.totalShopWorkers, 0),
          jobsOnSchedule: jobsWithProgress.filter(job => job.progressIndicators.onSchedule).length,
          jobsBehindSchedule: jobsWithProgress.filter(job => !job.progressIndicators.onSchedule).length
        }
      }
    });

  } catch (error) {
    console.error("Error fetching admin jobs overview:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch jobs overview",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}