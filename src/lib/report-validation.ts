import { z } from "zod";

// Report type enum
export const ReportTypeSchema = z.enum([
  "INSPECTION",
  "NCR",
  "SAFETY",
  "PROGRESS",
  "INCIDENT"
]);

// Report status enum
export const ReportStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "REVIEWED",
  "APPROVED"
]);

// Work location enum
export const WorkLocationSchema = z.enum([
  "FIELD",
  "SHOP"
]);

// Base report data schema
export const BaseReportSchema = z.object({
  id: z.string().cuid().optional(),
  jobId: z.string().cuid("Invalid job ID format"),
  userId: z.string().cuid("Invalid user ID format").optional(),
  type: ReportTypeSchema,
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  content: z.string()
    .min(1, "Content is required"),
  attachments: z.array(z.string().url("Invalid attachment URL")).default([]),
  status: ReportStatusSchema.default("DRAFT"),
  submittedAt: z.date().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Report creation schema (for POST requests)
export const CreateReportSchema = BaseReportSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true
}).extend({
  formData: z.record(z.any()),
  templateId: z.string().optional()
});

// Report update schema (for PUT requests)
export const UpdateReportSchema = z.object({
  id: z.string().cuid("Invalid report ID format"),
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .optional(),
  formData: z.record(z.any()).optional(),
  status: ReportStatusSchema.optional(),
  attachments: z.array(z.string().url("Invalid attachment URL")).optional()
});

// Report query/filter schema
export const ReportQuerySchema = z.object({
  jobId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  type: ReportTypeSchema.optional(),
  status: ReportStatusSchema.optional(),
  location: WorkLocationSchema.optional(),
  startDate: z.string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  endDate: z.string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(50),
  offset: z.number()
    .int()
    .min(0)
    .default(0),
  sortBy: z.enum(["createdAt", "updatedAt", "submittedAt", "title", "type"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"])
    .default("desc")
});

// Inspection-specific validation schemas
export const InspectionFormSchema = z.object({
  "inspector-name": z.string().min(1, "Inspector name is required"),
  "inspection-date": z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  "inspection-time": z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  "location": WorkLocationSchema,
  "weather-conditions": z.enum([
    "SUNNY", "CLOUDY", "RAINY", "SNOW", "WINDY"
  ]).optional(),
  "ppe-compliance": z.enum([
    "EXCELLENT", "GOOD", "NEEDS_IMPROVEMENT", "POOR"
  ]),
  "safety-hazards": z.array(z.enum([
    "SLIP_FALL", "ELECTRICAL", "CHEMICAL", "MACHINERY",
    "CONFINED_SPACE", "HEIGHT", "OTHER"
  ])).optional(),
  "hazard-description": z.string().max(1000).optional(),
  "work-areas-inspected": z.string().min(1, "Work areas must be specified"),
  "quality-rating": z.enum([
    "EXCELLENT", "GOOD", "ACCEPTABLE", "POOR"
  ]),
  "deficiencies-found": z.boolean().optional(),
  "deficiency-details": z.string().max(1000).optional(),
  "photos": z.array(z.string().url()).optional(),
  "additional-notes": z.string().max(2000).optional(),
  "inspector-signature": z.string().min(1, "Inspector signature is required")
});

// NCR-specific validation schema
export const NCRFormSchema = z.object({
  "ncr-number": z.string().min(1, "NCR number is required"),
  "date-identified": z.string().datetime("Invalid datetime format"),
  "identified-by": z.string().min(1, "Identifier name is required"),
  "location-area": z.string().min(1, "Location is required"),
  "severity": z.enum([
    "CRITICAL", "MAJOR", "MINOR"
  ]),
  "nonconformance-description": z.string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description too long"),
  "requirements-violated": z.string()
    .min(10, "Requirements violated must be specified")
    .max(1000),
  "root-cause-analysis": z.string().max(1000).optional(),
  "evidence-photos": z.array(z.string().url())
    .min(1, "At least one evidence photo is required"),
  "immediate-action": z.string()
    .min(10, "Immediate action must be specified")
    .max(1000),
  "responsible-person": z.string().min(1, "Responsible person is required"),
  "target-completion": z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  "preventive-measures": z.string().max(1000).optional()
});

// Safety incident validation schema
export const SafetyFormSchema = z.object({
  "incident-type": z.enum([
    "INJURY", "NEAR_MISS", "PROPERTY_DAMAGE", "ENVIRONMENTAL"
  ]),
  "incident-date": z.string().datetime("Invalid datetime format"),
  "reported-by": z.string().min(1, "Reporter name is required"),
  "incident-location": z.string().min(1, "Incident location is required"),
  "what-happened": z.string()
    .min(20, "Incident description must be at least 20 characters")
    .max(2000),
  "contributing-factors": z.array(z.enum([
    "INADEQUATE_PPE", "UNSAFE_BEHAVIOR", "EQUIPMENT_FAILURE",
    "ENVIRONMENTAL", "TRAINING", "COMMUNICATION", "PROCEDURE"
  ])).optional(),
  "witnesses": z.string().max(1000).optional(),
  "injured-person": z.string().optional(),
  "injury-type": z.enum([
    "CUT_LACERATION", "BRUISE_CONTUSION", "STRAIN_SPRAIN",
    "FRACTURE", "BURN", "EYE_INJURY", "OTHER"
  ]).optional(),
  "medical-attention": z.enum([
    "FIRST_AID", "MEDICAL_TREATMENT", "HOSPITALIZATION", "NONE"
  ]).optional()
});

// Template validation mapping
export const TemplateValidationMap = {
  inspection: InspectionFormSchema,
  ncr: NCRFormSchema,
  safety: SafetyFormSchema
} as const;

// Helper function to get validation schema by template ID
export function getValidationSchema(templateId: string): z.ZodSchema | null {
  const schema = TemplateValidationMap[templateId as keyof typeof TemplateValidationMap];
  return schema || null;
}

// Report response schema (for API responses)
export const ReportResponseSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  userId: z.string(),
  type: ReportTypeSchema,
  title: z.string(),
  content: z.any(), // Parsed JSON content
  attachments: z.array(z.string()),
  status: ReportStatusSchema,
  submittedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string()
  }).optional(),
  job: z.object({
    id: z.string(),
    name: z.string(),
    location: z.string()
  }).optional()
});

// Paginated reports response schema
export const PaginatedReportsSchema = z.object({
  reports: z.array(ReportResponseSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean()
  })
});

// Export all schemas as types
export type ReportType = z.infer<typeof ReportTypeSchema>;
export type ReportStatus = z.infer<typeof ReportStatusSchema>;
export type WorkLocation = z.infer<typeof WorkLocationSchema>;
export type BaseReport = z.infer<typeof BaseReportSchema>;
export type CreateReport = z.infer<typeof CreateReportSchema>;
export type UpdateReport = z.infer<typeof UpdateReportSchema>;
export type ReportQuery = z.infer<typeof ReportQuerySchema>;
export type ReportResponse = z.infer<typeof ReportResponseSchema>;
export type PaginatedReports = z.infer<typeof PaginatedReportsSchema>;
export type InspectionForm = z.infer<typeof InspectionFormSchema>;
export type NCRForm = z.infer<typeof NCRFormSchema>;
export type SafetyForm = z.infer<typeof SafetyFormSchema>;