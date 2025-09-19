import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { broadcastTyping } from "../../ws/route";
import { z } from "zod";

const typingSchema = z.object({
  jobId: z.string(),
  isTyping: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, isTyping } = typingSchema.parse(body);

    // Broadcast typing indicator to other users in the job
    broadcastTyping(jobId, session.user.id, isTyping);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error broadcasting typing indicator:", error);
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