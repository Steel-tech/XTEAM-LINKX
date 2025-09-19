import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-utils";
import {
  getTemplateByType,
  generateZodSchema,
  validateFormData
} from "@/lib/report-templates";

// GET /api/reports/templates/[templateId] - Get specific template details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { templateId } = resolvedParams;

    const template = getTemplateByType(templateId);
    if (!template) {
      return apiError(`Template not found: ${templateId}`, 404);
    }

    return apiSuccess(template);

  } catch (error) {
    console.error("Error fetching template:", error);
    return apiError("Failed to fetch template", 500);
  }
}

// POST /api/reports/templates/[templateId]/validate - Validate form data against template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { templateId } = resolvedParams;
    const body = await request.json();

    const template = getTemplateByType(templateId);
    if (!template) {
      return apiError(`Template not found: ${templateId}`, 404);
    }

    if (!body.formData) {
      return apiError("Form data is required", 400);
    }

    // Validate using our custom validation
    const validation = validateFormData(template, body.formData);

    if (!validation.isValid) {
      return apiSuccess({
        valid: false,
        errors: validation.errors,
        fieldCount: Object.keys(body.formData).length,
        requiredFields: template.sections.flatMap(section =>
          section.fields.filter(field => field.required).map(field => field.id)
        )
      }, "Form validation completed");
    }

    // Also validate with Zod schema for additional type safety
    try {
      const zodSchema = generateZodSchema(template);
      zodSchema.parse(body.formData);

      return apiSuccess({
        valid: true,
        errors: {},
        fieldCount: Object.keys(body.formData).length,
        message: "Form data is valid"
      }, "Form validation passed");

    } catch (zodError: any) {
      return apiSuccess({
        valid: false,
        errors: { zodValidation: zodError.message },
        fieldCount: Object.keys(body.formData).length
      }, "Zod validation failed");
    }

  } catch (error) {
    console.error("Error validating form data:", error);
    return apiError("Failed to validate form data", 500);
  }
}