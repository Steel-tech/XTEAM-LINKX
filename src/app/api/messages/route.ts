import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastMessage } from "../ws/route";
import { z } from "zod";

const createMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  jobId: z.string().optional(),
  type: z.enum(["text", "image", "file", "system"]).default("text"),
});

const getMessagesSchema = z.object({
  jobId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, jobId, type } = createMessageSchema.parse(body);

    // Verify user has access to the job if jobId is provided
    if (jobId) {
      const jobMember = await prisma.jobMember.findFirst({
        where: {
          jobId,
          userId: session.user.id,
        },
      });

      if (!jobMember) {
        return NextResponse.json(
          { error: "Access denied to this job" },
          { status: 403 }
        );
      }
    }

    const message = await prisma.message.create({
      data: {
        content,
        type,
        senderId: session.user.id,
        jobId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        job: jobId
          ? {
              select: {
                id: true,
                title: true,
                name: true,
              },
            }
          : false,
      },
    });

    // Broadcast the message to all connected clients for this job
    if (jobId) {
      broadcastMessage(jobId, message);
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error creating message:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { jobId, limit, cursor } = getMessagesSchema.parse(
      Object.fromEntries(searchParams)
    );

    // Verify user has access to the job if jobId is provided
    if (jobId) {
      const jobMember = await prisma.jobMember.findFirst({
        where: {
          jobId,
          userId: session.user.id,
        },
      });

      if (!jobMember) {
        return NextResponse.json(
          { error: "Access denied to this job" },
          { status: 403 }
        );
      }
    }

    const messages = await prisma.message.findMany({
      where: {
        ...(jobId ? { jobId } : {}),
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        job: jobId
          ? {
              select: {
                id: true,
                title: true,
                name: true,
              },
            }
          : false,
      },
    });

    const nextCursor = messages.length === limit ? messages[messages.length - 1]?.id : null;

    return NextResponse.json({
      messages: messages.reverse(), // Return in chronological order
      nextCursor,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}