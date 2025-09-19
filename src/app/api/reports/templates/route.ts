import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-utils";
import {
  getAllTemplates,
  getTemplateByType,
  type FormTemplate
} from "@/lib/report-templates";

// GET /api/reports/templates - Get all available report templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type) {
      // Get specific template by type
      const template = getTemplateByType(type);
      if (!template) {
        return apiError(`Template not found for type: ${type}`, 404);
      }
      return apiSuccess(template);
    }

    // Get all templates
    const templates = getAllTemplates();

    // Return template metadata for listing
    const templateSummary = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      reportType: template.reportType,
      version: template.version,
      sectionCount: template.sections.length,
      fieldCount: template.sections.reduce((total, section) => total + section.fields.length, 0),
      metadata: template.metadata
    }));

    return apiSuccess({
      templates: templateSummary,
      count: templates.length
    });

  } catch (error) {
    console.error("Error fetching templates:", error);
    return apiError("Failed to fetch templates", 500);
  }
}