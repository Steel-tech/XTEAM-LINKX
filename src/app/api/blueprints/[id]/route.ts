import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

// GET /api/blueprints/[id] - Load a specific blueprint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const blueprintId = resolvedParams.id;

    if (!blueprintId) {
      return apiError("Blueprint ID is required", 400);
    }

    const blueprint = await prisma.blueprint.findUnique({
      where: { id: blueprintId },
      include: {
        job: {
          select: {
            id: true,
            name: true,
            location: true,
            status: true,
          },
        },
        markupSaves: {
          orderBy: { updatedAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!blueprint) {
      return apiError("Blueprint not found", 404);
    }

    return apiSuccess(blueprint, "Blueprint loaded successfully");
  } catch (error) {
    console.error("Error loading blueprint:", error);
    return apiError("Failed to load blueprint", 500);
  }
}