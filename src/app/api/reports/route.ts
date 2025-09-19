import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, validateRequest } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { z } from "zod";
import {
  getTemplateByType,
  generateZodSchema,
  validateFormData,
  type FormTemplate
} from "@/lib/report-templates";

// Report submission schema
const submitReportSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  type: z.enum(["INSPECTION", "NCR", "SAFETY", "PROGRESS", "INCIDENT"]),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  formData: z.record(z.any()),
  templateId: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED"]).default("DRAFT"),
  attachments: z.array(z.string()).default([])
});

// Query schema for filtering reports
const querySchema = z.object({
  jobId: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  userId: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// GET /api/reports - Retrieve reports with filtering
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Authentication required", 401);
    }
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    const validation = querySchema.safeParse(query);
    if (!validation.success) {
      return apiError("Invalid query parameters", 400);
    }

    const { jobId, type, status, userId, limit = 50, offset = 0, startDate, endDate } = validation.data;

    // Build where clause with user authorization
    const where: any = {};

    // If jobId is provided, verify user has access to this job
    if (jobId) {
      const jobAccess = await prisma.crewAssignment.findFirst({
        where: {
          jobId,
          userId: session.user.id,
          status: "ACTIVE"
        }
      });

      if (!jobAccess) {
        return apiError("Access denied to this job", 403);
      }

      where.jobId = jobId;
    } else {
      // If no specific job, only show reports from jobs user has access to
      const userJobs = await prisma.crewAssignment.findMany({
        where: {
          userId: session.user.id,
          status: "ACTIVE"
        },
        select: { jobId: true }
      });

      where.jobId = {
        in: userJobs.map(job => job.jobId)
      };
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get reports with related data
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          job: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: Math.min(limit, 100), // Cap at 100
        skip: offset
      }),
      prisma.report.count({ where })
    ]);

    // Parse JSON content back to object
    const reportsWithParsedContent = reports.map(report => ({
      ...report,
      content: (() => {
        try {
          return JSON.parse(report.content);
        } catch {
          return report.content; // Return as-is if not valid JSON
        }
      })(),
      attachments: (() => {
        try {
          return JSON.parse(report.attachments);
        } catch {
          return [];
        }
      })()
    }));

    return apiSuccess({
      reports: reportsWithParsedContent,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error("Error fetching reports:", error);
    return apiError("Failed to fetch reports", 500);
  }
}

// POST /api/reports - Submit a new report
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Authentication required", 401);
    }
    const validation = await validateRequest(request, submitReportSchema);
    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const { jobId, type, title, formData, templateId, status, attachments } = validation.data;

    // Verify job exists and user has access
    const userJobAccess = await prisma.crewAssignment.findFirst({
      where: {
        jobId,
        userId: session.user.id,
        status: "ACTIVE"
      },
      include: {
        job: true
      }
    });

    if (!userJobAccess) {
      return apiError("Job not found or access denied", 404);
    }

    const userId = session.user.id;

    // Validate form data against template if provided
    if (templateId) {
      const template = getTemplateByType(templateId);
      if (template) {
        const formValidation = validateFormData(template, formData);
        if (!formValidation.isValid) {
          return apiError("Form validation failed", 400);
        }
      }
    }

    // Use transaction for report creation with potential NCR number generation
    const report = await prisma.$transaction(async (tx) => {
      // Generate report number for NCRs
      if (type === "NCR") {
        const today = new Date().toISOString().split("T")[0]?.replace(/-/g, "") || "";
        const ncrCount = await tx.report.count({
          where: {
            type: "NCR",
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        });
        const reportNumber = `NCR-${today}-${(ncrCount + 1).toString().padStart(3, "0")}`;

        // Add report number to form data
        formData["ncr-number"] = reportNumber;
      }

      // Create the report
      return await tx.report.create({
        data: {
          jobId,
          userId,
          type,
          title,
          content: JSON.stringify(formData),
          attachments: JSON.stringify(attachments),
          status,
          submittedAt: status === "SUBMITTED" ? new Date() : null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          job: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
        }
      });
    });

    // Parse content back for response
    const reportWithParsedContent = {
      ...report,
      content: JSON.parse(report.content),
      attachments: JSON.parse(report.attachments)
    };

    return apiSuccess(reportWithParsedContent, `Report ${status === "SUBMITTED" ? "submitted" : "saved"} successfully`);

  } catch (error) {
    console.error("Error creating report:", error);
    return apiError("Failed to create report", 500);
  }
}

// PUT /api/reports - Update existing report
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Authentication required", 401);
    }
    const updateSchema = z.object({
      id: z.string().min(1, "Report ID is required"),
      title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
      formData: z.record(z.any()).optional(),
      status: z.enum(["DRAFT", "SUBMITTED", "REVIEWED", "APPROVED"]).optional(),
      attachments: z.array(z.string()).optional()
    });

    const validation = await validateRequest(request, updateSchema);
    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const { id, title, formData, status, attachments } = validation.data;

    // Check if report exists and user has permission
    const existingReport = await prisma.report.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        job: {
          include: {
            crewAssignments: {
              where: {
                userId: session.user.id,
                status: "ACTIVE"
              }
            }
          }
        }
      }
    });

    if (!existingReport || existingReport.job.crewAssignments.length === 0) {
      return apiError("Report not found or access denied", 404);
    }

    // Prepare update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (formData) updateData.content = JSON.stringify(formData);
    if (status) {
      updateData.status = status;
      if (status === "SUBMITTED" && !existingReport.submittedAt) {
        updateData.submittedAt = new Date();
      }
    }
    if (attachments) updateData.attachments = JSON.stringify(attachments);

    // Update the report
    const updatedReport = await prisma.report.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        job: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      }
    });

    // Parse content for response
    const reportWithParsedContent = {
      ...updatedReport,
      content: JSON.parse(updatedReport.content),
      attachments: JSON.parse(updatedReport.attachments)
    };

    return apiSuccess(reportWithParsedContent, "Report updated successfully");

  } catch (error) {
    console.error("Error updating report:", error);
    return apiError("Failed to update report", 500);
  }
}