import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

// Simple in-memory storage for SSE connections
const connections = new Map<string, ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return new Response("Job ID is required", { status: 400 });
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Store the connection
      const connectionId = `${session.user.id}-${jobId}-${Date.now()}`;
      connections.set(connectionId, controller);

      // Send initial connection message
      controller.enqueue(
        `data: ${JSON.stringify({
          type: "connected",
          message: "Connected to job channel",
          jobId,
          timestamp: new Date().toISOString(),
        })}\n\n`
      );

      // Clean up on close
      request.signal.addEventListener("abort", () => {
        connections.delete(connectionId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

// Utility function to broadcast messages to all connected clients
export function broadcastMessage(jobId: string, message: any) {
  const messageData = `data: ${JSON.stringify({
    type: "message",
    ...message,
    timestamp: new Date().toISOString(),
  })}\n\n`;

  // Send to all connections for this job
  for (const [connectionId, controller] of connections.entries()) {
    if (connectionId.includes(jobId)) {
      try {
        controller.enqueue(messageData);
      } catch (error) {
        // Connection closed, remove it
        connections.delete(connectionId);
      }
    }
  }
}

// Utility function to broadcast typing indicators
export function broadcastTyping(jobId: string, userId: string, isTyping: boolean) {
  const typingData = `data: ${JSON.stringify({
    type: "typing",
    userId,
    isTyping,
    jobId,
    timestamp: new Date().toISOString(),
  })}\n\n`;

  // Send to all connections for this job except the sender
  for (const [connectionId, controller] of connections.entries()) {
    if (connectionId.includes(jobId) && !connectionId.includes(userId)) {
      try {
        controller.enqueue(typingData);
      } catch (error) {
        // Connection closed, remove it
        connections.delete(connectionId);
      }
    }
  }
}