import { describe, it, expect } from "vitest";
import {
  getTemplateByType,
  getAllTemplates,
  validateFormData,
  generateZodSchema,
  inspectionTemplate,
  ncrTemplate,
  safetyTemplate
} from "../report-templates";

describe("Report Templates", () => {
  describe("Template Retrieval", () => {
    it("should retrieve templates by type", () => {
      const inspection = getTemplateByType("inspection");
      expect(inspection).toBeDefined();
      expect(inspection?.reportType).toBe("INSPECTION");

      const ncr = getTemplateByType("ncr");
      expect(ncr).toBeDefined();
      expect(ncr?.reportType).toBe("NCR");

      const safety = getTemplateByType("safety");
      expect(safety).toBeDefined();
      expect(safety?.reportType).toBe("SAFETY");
    });

    it("should return null for unknown template types", () => {
      const unknown = getTemplateByType("unknown");
      expect(unknown).toBeNull();
    });

    it("should get all templates", () => {
      const templates = getAllTemplates();
      expect(templates).toHaveLength(3);
      expect(templates.map(t => t.reportType)).toEqual(
        expect.arrayContaining(["INSPECTION", "NCR", "SAFETY"])
      );
    });
  });

  describe("Form Validation", () => {
    it("should validate inspection form data correctly", () => {
      const validData = {
        "inspector-name": "John Doe",
        "inspection-date": "2024-01-15",
        "inspection-time": "10:30",
        "location": "FIELD",
        "ppe-compliance": "EXCELLENT",
        "work-areas-inspected": "Area A, Area B",
        "quality-rating": "GOOD",
        "inspector-signature": "John Doe"
      };

      const result = validateFormData(inspectionTemplate, validData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("should catch missing required fields", () => {
      const invalidData = {
        "inspector-name": "John Doe",
        // Missing required fields
      };

      const result = validateFormData(inspectionTemplate, invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty("inspection-date");
      expect(result.errors).toHaveProperty("inspection-time");
      expect(result.errors).toHaveProperty("location");
    });

    it("should validate NCR form data", () => {
      const validNCRData = {
        "ncr-number": "NCR-20240115-001",
        "date-identified": "2024-01-15T10:30:00.000Z",
        "identified-by": "Jane Smith",
        "location-area": "Building A",
        "severity": "MAJOR",
        "nonconformance-description": "Material does not meet specification requirements",
        "requirements-violated": "ASTM A36 steel grade requirements",
        "evidence-photos": ["https://example.com/photo1.jpg"],
        "immediate-action": "Stop work and remove non-conforming material",
        "responsible-person": "Project Manager",
        "target-completion": "2024-01-20"
      };

      const result = validateFormData(ncrTemplate, validNCRData);
      expect(result.isValid).toBe(true);
    });

    it("should validate safety incident form data", () => {
      const validSafetyData = {
        "incident-type": "NEAR_MISS",
        "incident-date": "2024-01-15T14:30:00.000Z",
        "reported-by": "Safety Officer",
        "incident-location": "Work Area C",
        "what-happened": "Worker almost slipped on wet surface but caught themselves"
      };

      const result = validateFormData(safetyTemplate, validSafetyData);
      expect(result.isValid).toBe(true);
    });
  });

  describe("Zod Schema Generation", () => {
    it("should generate valid Zod schema for inspection template", () => {
      const schema = generateZodSchema(inspectionTemplate);
      expect(schema).toBeDefined();

      // Test with valid data
      const validData = {
        "inspector-name": "John Doe",
        "inspection-date": "2024-01-15",
        "inspection-time": "10:30",
        "location": "FIELD",
        "ppe-compliance": "EXCELLENT",
        "work-areas-inspected": "Test area",
        "quality-rating": "GOOD",
        "inspector-signature": "John Doe"
      };

      expect(() => schema.parse(validData)).not.toThrow();
    });

    it("should generate schema that rejects invalid data", () => {
      const schema = generateZodSchema(inspectionTemplate);

      const invalidData = {
        "inspector-name": "", // Empty required field
        "location": "INVALID_LOCATION", // Invalid enum value
      };

      expect(() => schema.parse(invalidData)).toThrow();
    });
  });

  describe("Template Structure", () => {
    it("should have properly structured inspection template", () => {
      expect(inspectionTemplate.sections).toHaveLength(4);
      expect(inspectionTemplate.sections[0].title).toBe("Basic Information");
      expect(inspectionTemplate.sections[1].title).toBe("Safety Checklist");
      expect(inspectionTemplate.sections[2].title).toBe("Quality Inspection");
      expect(inspectionTemplate.sections[3].title).toBe("Documentation & Photos");
    });

    it("should have required fields marked correctly", () => {
      const requiredFields = inspectionTemplate.sections
        .flatMap(section => section.fields)
        .filter(field => field.required);

      expect(requiredFields.length).toBeGreaterThan(0);

      const inspectorNameField = requiredFields.find(f => f.id === "inspector-name");
      expect(inspectorNameField).toBeDefined();
      expect(inspectorNameField?.required).toBe(true);
    });

    it("should have conditional fields properly configured", () => {
      const weatherField = inspectionTemplate.sections[0].fields
        .find(f => f.id === "weather-conditions");

      expect(weatherField?.conditional).toBeDefined();
      expect(weatherField?.conditional?.field).toBe("location");
      expect(weatherField?.conditional?.value).toBe("FIELD");
    });
  });
});

describe("Form Field Types", () => {
  it("should support all defined field types", () => {
    const allFieldTypes = getAllTemplates()
      .flatMap(template => template.sections)
      .flatMap(section => section.fields)
      .map(field => field.type);

    const uniqueTypes = [...new Set(allFieldTypes)];

    expect(uniqueTypes).toEqual(
      expect.arrayContaining([
        "text", "textarea", "select", "multiselect",
        "checkbox", "radio", "date", "time", "datetime",
        "file", "signature"
      ])
    );
  });

  it("should have valid options for select fields", () => {
    const selectFields = getAllTemplates()
      .flatMap(template => template.sections)
      .flatMap(section => section.fields)
      .filter(field => ["select", "radio", "multiselect"].includes(field.type));

    selectFields.forEach(field => {
      expect(field.options).toBeDefined();
      expect(Array.isArray(field.options)).toBe(true);
      expect(field.options!.length).toBeGreaterThan(0);

      field.options!.forEach(option => {
        expect(option).toHaveProperty("value");
        expect(option).toHaveProperty("label");
        expect(typeof option.value).toBe("string");
        expect(typeof option.label).toBe("string");
      });
    });
  });
});