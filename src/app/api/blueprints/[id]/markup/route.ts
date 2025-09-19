import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, validateRequest } from "@/lib/api-utils";

const MarkupSaveSchema = z.object({
  name: z.string().min(1, "Markup name is required"),
  markupData: z.string().min(1, "Markup data is required"),
  description: z.string().optional(),
  isShared: z.boolean().default(false),
  userId: z.string().optional(),
});

const MarkupUpdateSchema = z.object({
  markupData: z.string().min(1, "Markup data is required"),
});

// POST /api/blueprints/[id]/markup - Save new markup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const blueprintId = resolvedParams.id;

    if (!blueprintId) {
      return apiError("Blueprint ID is required", 400);
    }

    // Validate blueprint exists
    const blueprint = await prisma.blueprint.findUnique({
      where: { id: blueprintId },
    });

    if (!blueprint) {
      return apiError("Blueprint not found", 404);
    }

    const validation = await validateRequest(request, MarkupSaveSchema);
    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const { name, markupData, description, isShared, userId } = validation.data;

    // Create new markup save
    const markupSave = await prisma.blueprintMarkup.create({
      data: {
        blueprintId,
        name,
        markupData,
        description,
        isShared,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return apiSuccess(markupSave, "Markup saved successfully");
  } catch (error) {
    console.error("Error saving markup:", error);
    return apiError("Failed to save markup", 500);
  }
}

// PUT /api/blueprints/[id]/markup - Update blueprint's main markup data
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const blueprintId = resolvedParams.id;

    if (!blueprintId) {
      return apiError("Blueprint ID is required", 400);
    }

    const validation = await validateRequest(request, MarkupUpdateSchema);
    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const { markupData } = validation.data;

    // Update blueprint's main markup data
    const updatedBlueprint = await prisma.blueprint.update({
      where: { id: blueprintId },
      data: {
        markups: markupData,
        updatedAt: new Date(),
      },
    });

    return apiSuccess(updatedBlueprint, "Blueprint markup updated successfully");
  } catch (error) {
    console.error("Error updating blueprint markup:", error);
    return apiError("Failed to update blueprint markup", 500);
  }
}

// GET /api/blueprints/[id]/markup - Get all saved markups for this blueprint
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

    const markups = await prisma.blueprintMarkup.findMany({
      where: { blueprintId },
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
    });

    return apiSuccess(markups, "Markups loaded successfully");
  } catch (error) {
    console.error("Error loading markups:", error);
    return apiError("Failed to load markups", 500);
  }
}