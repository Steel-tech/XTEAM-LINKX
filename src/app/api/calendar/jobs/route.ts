import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ACTIVE";

    const jobs = await prisma.job.findMany({
      where: {
        status: status,
      },
      select: {
        id: true,
        name: true,
        title: true,
        client: true,
        status: true,
        startDate: true,
        endDate: true,
        _count: {
          select: {
            events: true,
            members: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error("Error fetching jobs for calendar:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch jobs",
      },
      { status: 500 }
    );
  }
}