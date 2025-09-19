import { z } from "zod";

// Base field types for dynamic form generation
export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "date"
  | "time"
  | "datetime"
  | "number"
  | "file"
  | "signature";

// Dynamic field definition
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: Array<{ value: string; label: string }>; // for select/radio/multiselect
  defaultValue?: any;
  description?: string;
  conditional?: {
    field: string;
    value: any;
    operator: "equals" | "not_equals" | "contains";
  };
}

// Form template structure
export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  reportType: "INSPECTION" | "NCR" | "SAFETY" | "PROGRESS" | "INCIDENT";
  version: number;
  sections: Array<{
    id: string;
    title: string;
    description?: string;
    fields: FormField[];
  }>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    isActive: boolean;
  };
}

// Inspection Report Template
export const inspectionTemplate: FormTemplate = {
  id: "inspection-v1",
  name: "Daily Inspection Report",
  description: "Standard daily inspection checklist for field and shop operations",
  reportType: "INSPECTION",
  version: 1,
  sections: [
    {
      id: "basic-info",
      title: "Basic Information",
      description: "General inspection details",
      fields: [
        {
          id: "inspector-name",
          type: "text",
          label: "Inspector Name",
          required: true,
          placeholder: "Enter inspector name"
        },
        {
          id: "inspection-date",
          type: "date",
          label: "Inspection Date",
          required: true,
          defaultValue: new Date().toISOString().split("T")[0]
        },
        {
          id: "inspection-time",
          type: "time",
          label: "Inspection Time",
          required: true,
          defaultValue: new Date().toTimeString().split(" ")[0]?.slice(0, 5) || "09:00"
        },
        {
          id: "location",
          type: "select",
          label: "Location",
          required: true,
          options: [
            { value: "FIELD", label: "Field" },
            { value: "SHOP", label: "Shop" }
          ]
        },
        {
          id: "weather-conditions",
          type: "select",
          label: "Weather Conditions",
          required: false,
          options: [
            { value: "SUNNY", label: "Sunny" },
            { value: "CLOUDY", label: "Cloudy" },
            { value: "RAINY", label: "Rainy" },
            { value: "SNOW", label: "Snow" },
            { value: "WINDY", label: "Windy" }
          ],
          conditional: {
            field: "location",
            value: "FIELD",
            operator: "equals"
          }
        }
      ]
    },
    {
      id: "safety-checklist",
      title: "Safety Checklist",
      description: "Review safety compliance and conditions",
      fields: [
        {
          id: "ppe-compliance",
          type: "radio",
          label: "PPE Compliance",
          required: true,
          options: [
            { value: "EXCELLENT", label: "Excellent - All crew wearing proper PPE" },
            { value: "GOOD", label: "Good - Minor issues noted" },
            { value: "NEEDS_IMPROVEMENT", label: "Needs Improvement - Safety meeting required" },
            { value: "POOR", label: "Poor - Immediate action required" }
          ]
        },
        {
          id: "safety-hazards",
          type: "multiselect",
          label: "Safety Hazards Identified",
          required: false,
          options: [
            { value: "SLIP_FALL", label: "Slip/Fall Hazard" },
            { value: "ELECTRICAL", label: "Electrical Hazard" },
            { value: "CHEMICAL", label: "Chemical Exposure" },
            { value: "MACHINERY", label: "Machinery/Equipment" },
            { value: "CONFINED_SPACE", label: "Confined Space" },
            { value: "HEIGHT", label: "Working at Height" },
            { value: "OTHER", label: "Other" }
          ]
        },
        {
          id: "hazard-description",
          type: "textarea",
          label: "Hazard Description & Corrective Actions",
          required: false,
          placeholder: "Describe identified hazards and actions taken...",
          conditional: {
            field: "safety-hazards",
            value: "",
            operator: "not_equals"
          }
        }
      ]
    },
    {
      id: "quality-inspection",
      title: "Quality Inspection",
      description: "Work quality and progress assessment",
      fields: [
        {
          id: "work-areas-inspected",
          type: "textarea",
          label: "Work Areas Inspected",
          required: true,
          placeholder: "List all areas/activities inspected..."
        },
        {
          id: "quality-rating",
          type: "radio",
          label: "Overall Quality Rating",
          required: true,
          options: [
            { value: "EXCELLENT", label: "Excellent - Exceeds standards" },
            { value: "GOOD", label: "Good - Meets standards" },
            { value: "ACCEPTABLE", label: "Acceptable - Minor rework needed" },
            { value: "POOR", label: "Poor - Major rework required" }
          ]
        },
        {
          id: "deficiencies-found",
          type: "checkbox",
          label: "Deficiencies Found",
          required: false
        },
        {
          id: "deficiency-details",
          type: "textarea",
          label: "Deficiency Details & Corrective Actions",
          required: false,
          placeholder: "Describe deficiencies and corrective actions taken...",
          conditional: {
            field: "deficiencies-found",
            value: true,
            operator: "equals"
          }
        }
      ]
    },
    {
      id: "documentation",
      title: "Documentation & Photos",
      description: "Supporting documentation and evidence",
      fields: [
        {
          id: "photos",
          type: "file",
          label: "Inspection Photos",
          required: false,
          description: "Upload photos of work areas, issues, or quality examples"
        },
        {
          id: "additional-notes",
          type: "textarea",
          label: "Additional Notes",
          required: false,
          placeholder: "Any additional observations, concerns, or recommendations..."
        },
        {
          id: "inspector-signature",
          type: "signature",
          label: "Inspector Signature",
          required: true
        }
      ]
    }
  ],
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "system",
    isActive: true
  }
};

// NCR (Non-Conformance Report) Template
export const ncrTemplate: FormTemplate = {
  id: "ncr-v1",
  name: "Non-Conformance Report (NCR)",
  description: "Report for documenting non-conformances and corrective actions",
  reportType: "NCR",
  version: 1,
  sections: [
    {
      id: "ncr-details",
      title: "Non-Conformance Details",
      fields: [
        {
          id: "ncr-number",
          type: "text",
          label: "NCR Number",
          required: true,
          placeholder: "Auto-generated or manual entry"
        },
        {
          id: "date-identified",
          type: "datetime",
          label: "Date & Time Identified",
          required: true,
          defaultValue: new Date().toISOString()
        },
        {
          id: "identified-by",
          type: "text",
          label: "Identified By",
          required: true,
          placeholder: "Name of person identifying the issue"
        },
        {
          id: "location-area",
          type: "text",
          label: "Location/Area",
          required: true,
          placeholder: "Specific location where issue was found"
        },
        {
          id: "severity",
          type: "select",
          label: "Severity Level",
          required: true,
          options: [
            { value: "CRITICAL", label: "Critical - Safety risk or major impact" },
            { value: "MAJOR", label: "Major - Significant impact on quality/schedule" },
            { value: "MINOR", label: "Minor - Low impact, easily correctable" }
          ]
        }
      ]
    },
    {
      id: "description",
      title: "Description & Analysis",
      fields: [
        {
          id: "nonconformance-description",
          type: "textarea",
          label: "Non-Conformance Description",
          required: true,
          placeholder: "Detailed description of what was found..."
        },
        {
          id: "requirements-violated",
          type: "textarea",
          label: "Requirements/Standards Violated",
          required: true,
          placeholder: "Specify which requirements, codes, or standards were not met..."
        },
        {
          id: "root-cause-analysis",
          type: "textarea",
          label: "Root Cause Analysis",
          required: false,
          placeholder: "Analysis of underlying causes..."
        },
        {
          id: "evidence-photos",
          type: "file",
          label: "Evidence Photos",
          required: true,
          description: "Photos documenting the non-conformance"
        }
      ]
    },
    {
      id: "corrective-action",
      title: "Corrective Action",
      fields: [
        {
          id: "immediate-action",
          type: "textarea",
          label: "Immediate Corrective Action",
          required: true,
          placeholder: "Actions taken immediately to address the issue..."
        },
        {
          id: "responsible-person",
          type: "text",
          label: "Responsible Person",
          required: true,
          placeholder: "Person responsible for corrective action"
        },
        {
          id: "target-completion",
          type: "date",
          label: "Target Completion Date",
          required: true
        },
        {
          id: "preventive-measures",
          type: "textarea",
          label: "Preventive Measures",
          required: false,
          placeholder: "Actions to prevent recurrence..."
        }
      ]
    }
  ],
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "system",
    isActive: true
  }
};

// Safety Report Template
export const safetyTemplate: FormTemplate = {
  id: "safety-v1",
  name: "Safety Incident Report",
  description: "Report for documenting safety incidents and near misses",
  reportType: "SAFETY",
  version: 1,
  sections: [
    {
      id: "incident-details",
      title: "Incident Details",
      fields: [
        {
          id: "incident-type",
          type: "select",
          label: "Incident Type",
          required: true,
          options: [
            { value: "INJURY", label: "Injury" },
            { value: "NEAR_MISS", label: "Near Miss" },
            { value: "PROPERTY_DAMAGE", label: "Property Damage" },
            { value: "ENVIRONMENTAL", label: "Environmental Incident" }
          ]
        },
        {
          id: "incident-date",
          type: "datetime",
          label: "Date & Time of Incident",
          required: true
        },
        {
          id: "reported-by",
          type: "text",
          label: "Reported By",
          required: true,
          placeholder: "Name of person reporting"
        },
        {
          id: "incident-location",
          type: "text",
          label: "Incident Location",
          required: true,
          placeholder: "Exact location where incident occurred"
        }
      ]
    },
    {
      id: "incident-description",
      title: "Incident Description",
      fields: [
        {
          id: "what-happened",
          type: "textarea",
          label: "What Happened?",
          required: true,
          placeholder: "Detailed description of the incident..."
        },
        {
          id: "contributing-factors",
          type: "multiselect",
          label: "Contributing Factors",
          required: false,
          options: [
            { value: "INADEQUATE_PPE", label: "Inadequate PPE" },
            { value: "UNSAFE_BEHAVIOR", label: "Unsafe Behavior" },
            { value: "EQUIPMENT_FAILURE", label: "Equipment Failure" },
            { value: "ENVIRONMENTAL", label: "Environmental Conditions" },
            { value: "TRAINING", label: "Inadequate Training" },
            { value: "COMMUNICATION", label: "Poor Communication" },
            { value: "PROCEDURE", label: "Inadequate Procedures" }
          ]
        },
        {
          id: "witnesses",
          type: "textarea",
          label: "Witnesses",
          required: false,
          placeholder: "Names and contact information of witnesses..."
        }
      ]
    },
    {
      id: "injury-details",
      title: "Injury Details",
      fields: [
        {
          id: "injured-person",
          type: "text",
          label: "Injured Person Name",
          required: false,
          conditional: {
            field: "incident-type",
            value: "INJURY",
            operator: "equals"
          }
        },
        {
          id: "injury-type",
          type: "select",
          label: "Type of Injury",
          required: false,
          options: [
            { value: "CUT_LACERATION", label: "Cut/Laceration" },
            { value: "BRUISE_CONTUSION", label: "Bruise/Contusion" },
            { value: "STRAIN_SPRAIN", label: "Strain/Sprain" },
            { value: "FRACTURE", label: "Fracture" },
            { value: "BURN", label: "Burn" },
            { value: "EYE_INJURY", label: "Eye Injury" },
            { value: "OTHER", label: "Other" }
          ],
          conditional: {
            field: "incident-type",
            value: "INJURY",
            operator: "equals"
          }
        },
        {
          id: "medical-attention",
          type: "radio",
          label: "Medical Attention Required",
          required: false,
          options: [
            { value: "FIRST_AID", label: "First Aid Only" },
            { value: "MEDICAL_TREATMENT", label: "Medical Treatment" },
            { value: "HOSPITALIZATION", label: "Hospitalization" },
            { value: "NONE", label: "None Required" }
          ],
          conditional: {
            field: "incident-type",
            value: "INJURY",
            operator: "equals"
          }
        }
      ]
    }
  ],
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "system",
    isActive: true
  }
};

// Template registry
export const reportTemplates: Record<string, FormTemplate> = {
  inspection: inspectionTemplate,
  ncr: ncrTemplate,
  safety: safetyTemplate
};

// Helper functions for template management
export function getTemplateByType(reportType: string): FormTemplate | null {
  return reportTemplates[reportType.toLowerCase()] || null;
}

export function getAllTemplates(): FormTemplate[] {
  return Object.values(reportTemplates);
}

export function validateFormData(template: FormTemplate, data: Record<string, any>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  template.sections.forEach(section => {
    section.fields.forEach(field => {
      const value = data[field.id];

      // Check required fields
      if (field.required && (!value || value === "")) {
        errors[field.id] = `${field.label} is required`;
        return;
      }

      // Skip validation if field is empty and not required
      if (!value) return;

      // Type-specific validation
      switch (field.type) {
        case "number":
          if (isNaN(Number(value))) {
            errors[field.id] = `${field.label} must be a valid number`;
          } else if (field.validation?.min && Number(value) < field.validation.min) {
            errors[field.id] = `${field.label} must be at least ${field.validation.min}`;
          } else if (field.validation?.max && Number(value) > field.validation.max) {
            errors[field.id] = `${field.label} must be at most ${field.validation.max}`;
          }
          break;

        case "text":
        case "textarea":
          if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) {
            errors[field.id] = field.validation.message || `${field.label} format is invalid`;
          }
          if (field.validation?.min && value.length < field.validation.min) {
            errors[field.id] = `${field.label} must be at least ${field.validation.min} characters`;
          }
          if (field.validation?.max && value.length > field.validation.max) {
            errors[field.id] = `${field.label} must be at most ${field.validation.max} characters`;
          }
          break;

        case "select":
        case "radio":
          const validOptions = field.options?.map(opt => opt.value) || [];
          if (!validOptions.includes(value)) {
            errors[field.id] = `${field.label} has an invalid selection`;
          }
          break;

        case "multiselect":
          if (Array.isArray(value)) {
            const validOptions = field.options?.map(opt => opt.value) || [];
            const invalidValues = value.filter(v => !validOptions.includes(v));
            if (invalidValues.length > 0) {
              errors[field.id] = `${field.label} contains invalid selections`;
            }
          }
          break;
      }
    });
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Zod schema generator for runtime validation
export function generateZodSchema(template: FormTemplate): z.ZodSchema {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  template.sections.forEach(section => {
    section.fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.type) {
        case "text":
        case "textarea":
          let stringSchema = z.string();
          if (field.validation?.min) {
            stringSchema = stringSchema.min(field.validation.min);
          }
          if (field.validation?.max) {
            stringSchema = stringSchema.max(field.validation.max);
          }
          fieldSchema = stringSchema;
          break;

        case "number":
          let numberSchema = z.number();
          if (field.validation?.min) {
            numberSchema = numberSchema.min(field.validation.min);
          }
          if (field.validation?.max) {
            numberSchema = numberSchema.max(field.validation.max);
          }
          fieldSchema = numberSchema;
          break;

        case "checkbox":
          fieldSchema = z.boolean();
          break;

        case "select":
        case "radio":
          const options = field.options?.map(opt => opt.value) || [];
          if (options.length > 0) {
            fieldSchema = z.enum(options as [string, ...string[]]);
          } else {
            fieldSchema = z.string();
          }
          break;

        case "multiselect":
          const multiOptions = field.options?.map(opt => opt.value) || [];
          if (multiOptions.length > 0) {
            fieldSchema = z.array(z.enum(multiOptions as [string, ...string[]]));
          } else {
            fieldSchema = z.array(z.string());
          }
          break;

        case "date":
          fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
          break;

        case "datetime":
          fieldSchema = z.string().datetime();
          break;

        case "time":
          fieldSchema = z.string().regex(/^\d{2}:\d{2}$/);
          break;

        case "file":
          fieldSchema = z.array(z.string()).or(z.string());
          break;

        case "signature":
          fieldSchema = z.string();
          break;

        default:
          fieldSchema = z.any();
      }

      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }

      schemaFields[field.id] = fieldSchema;
    });
  });

  return z.object(schemaFields);
}