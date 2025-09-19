"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Save, Send, FileText, AlertTriangle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FormTemplate,
  FormField as TemplateField,
  reportTemplates,
  getTemplateByType,
  validateFormData
} from "@/lib/report-templates";

// Base report form schema
const baseReportSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  type: z.enum(["INSPECTION", "NCR", "SAFETY", "PROGRESS", "INCIDENT"]),
  templateId: z.string().optional(),
  formData: z.record(z.any()).default({}),
  status: z.enum(["DRAFT", "SUBMITTED"]).default("DRAFT"),
});

type ReportFormData = z.infer<typeof baseReportSchema>;

interface ReportFormProps {
  jobId: string;
  onSubmit: (data: ReportFormData) => Promise<void>;
  initialData?: Partial<ReportFormData>;
  isLoading?: boolean;
}

// Dynamic field renderer component
function DynamicField({
  field,
  control,
  formData,
  errors
}: {
  field: TemplateField;
  control: any;
  formData: Record<string, any>;
  errors: Record<string, string>;
}) {
  // Check conditional rendering
  if (field.conditional) {
    const conditionValue = formData[field.conditional.field];
    const shouldShow = field.conditional.operator === "equals"
      ? conditionValue === field.conditional.value
      : field.conditional.operator === "not_equals"
      ? conditionValue !== field.conditional.value
      : field.conditional.operator === "contains"
      ? Array.isArray(conditionValue) && conditionValue.length > 0
      : true;

    if (!shouldShow) return null;
  }

  const error = errors[field.id];

  return (
    <FormField
      control={control}
      name={`formData.${field.id}`}
      render={({ field: formField }) => (
        <FormItem className="space-y-2">
          <FormLabel className={cn("font-body text-sm", field.required && "after:content-['*'] after:text-destructive")}>
            {field.label}
          </FormLabel>
          <FormControl>
            {field.type === "text" && (
              <Input
                {...formField}
                placeholder={field.placeholder}
                className="font-body"
              />
            )}
            {field.type === "textarea" && (
              <textarea
                {...formField}
                placeholder={field.placeholder}
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            )}
            {field.type === "select" && (
              <Select onValueChange={formField.onChange} value={formField.value}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="font-body">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {field.type === "radio" && (
              <div className="space-y-2">
                {field.options?.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${field.id}-${option.value}`}
                      value={option.value}
                      checked={formField.value === option.value}
                      onChange={(e) => formField.onChange(e.target.value)}
                      className="h-4 w-4 text-primary focus:ring-primary border-input"
                    />
                    <Label htmlFor={`${field.id}-${option.value}`} className="font-body text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
            {field.type === "checkbox" && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={field.id}
                  checked={formField.value === true}
                  onChange={(e) => formField.onChange(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                />
                <Label htmlFor={field.id} className="font-body text-sm">
                  {field.label}
                </Label>
              </div>
            )}
            {field.type === "multiselect" && (
              <div className="space-y-2">
                {field.options?.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`${field.id}-${option.value}`}
                      checked={Array.isArray(formField.value) && formField.value.includes(option.value)}
                      onChange={(e) => {
                        const currentValues = Array.isArray(formField.value) ? formField.value : [];
                        if (e.target.checked) {
                          formField.onChange([...currentValues, option.value]);
                        } else {
                          formField.onChange(currentValues.filter((v: string) => v !== option.value));
                        }
                      }}
                      className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                    />
                    <Label htmlFor={`${field.id}-${option.value}`} className="font-body text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
            {field.type === "date" && (
              <Input
                {...formField}
                type="date"
                className="font-body"
              />
            )}
            {field.type === "time" && (
              <Input
                {...formField}
                type="time"
                className="font-body"
              />
            )}
            {field.type === "datetime" && (
              <Input
                {...formField}
                type="datetime-local"
                className="font-body"
              />
            )}
            {field.type === "number" && (
              <Input
                {...formField}
                type="number"
                placeholder={field.placeholder}
                min={field.validation?.min}
                max={field.validation?.max}
                className="font-body"
              />
            )}
            {field.type === "file" && (
              <Input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  formField.onChange(files.map(f => f.name)); // For now, just store file names
                }}
                className="font-body"
              />
            )}
            {field.type === "signature" && (
              <div className="border-2 border-dashed border-input rounded-md p-4 text-center">
                <div className="text-muted-foreground font-body text-sm">
                  Signature field - Implementation needed
                </div>
              </div>
            )}
          </FormControl>
          {field.description && (
            <FormDescription className="font-body text-xs">
              {field.description}
            </FormDescription>
          )}
          {error && (
            <FormMessage className="font-body text-sm text-destructive">
              {error}
            </FormMessage>
          )}
        </FormItem>
      )}
    />
  );
}

export default function ReportForm({ jobId, onSubmit, initialData, isLoading = false }: ReportFormProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const form = useForm<ReportFormData>({
    resolver: zodResolver(baseReportSchema),
    defaultValues: {
      title: "",
      type: "INSPECTION",
      templateId: "",
      formData: {},
      status: "DRAFT",
      ...initialData
    }
  });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = form;
  const watchedType = watch("type");
  const watchedFormData = watch("formData");

  // Load template when type changes
  useEffect(() => {
    const template = getTemplateByType(watchedType.toLowerCase());
    setSelectedTemplate(template);
    setValue("templateId", template?.id || "");

    // Reset form data when template changes
    setValue("formData", {});
    setValidationErrors({});
  }, [watchedType, setValue]);

  // Validate form data against template
  const validateTemplate = useCallback(() => {
    if (!selectedTemplate) return {};

    const validation = validateFormData(selectedTemplate, watchedFormData);
    setValidationErrors(validation.errors);
    return validation.errors;
  }, [selectedTemplate, watchedFormData]);

  // Real-time validation
  useEffect(() => {
    validateTemplate();
  }, [validateTemplate]);

  const onFormSubmit = async (data: ReportFormData) => {
    // Final validation before submit
    const templateErrors = validateTemplate();
    if (Object.keys(templateErrors).length > 0) {
      return;
    }

    await onSubmit(data);
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "INSPECTION": return <FileText className="w-4 h-4" />;
      case "NCR": return <AlertTriangle className="w-4 h-4" />;
      case "SAFETY": return <Shield className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-2xl">Create Report</CardTitle>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-body text-sm text-muted-foreground">
              {new Date().toLocaleDateString()}
            </span>
            <Clock className="w-4 h-4 text-muted-foreground ml-2" />
            <span className="font-body text-sm text-muted-foreground">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="space-y-4">
          <FormField
            control={control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-heading text-base">Report Type</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {["INSPECTION", "NCR", "SAFETY", "PROGRESS", "INCIDENT"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => field.onChange(type)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border-2 transition-colors font-body text-sm",
                          field.value === type
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {getReportTypeIcon(type)}
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Report Title */}
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-heading text-base">Report Title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter a descriptive title for your report"
                    className="font-body"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {selectedTemplate && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="font-body">
                    {selectedTemplate.name}
                  </Badge>
                  <span className="font-body text-sm text-muted-foreground">
                    {selectedTemplate.description}
                  </span>
                </div>

                <Tabs defaultValue={selectedTemplate.sections[0]?.id} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
                    {selectedTemplate.sections.map((section) => (
                      <TabsTrigger
                        key={section.id}
                        value={section.id}
                        className="font-body text-xs md:text-sm"
                      >
                        {section.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {selectedTemplate.sections.map((section) => (
                    <TabsContent key={section.id} value={section.id} className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-heading text-lg">{section.title}</h3>
                        {section.description && (
                          <p className="font-body text-sm text-muted-foreground">
                            {section.description}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        {section.fields.map((field) => (
                          <div key={field.id} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                            <DynamicField
                              field={field}
                              control={control}
                              formData={watchedFormData}
                              errors={validationErrors}
                            />
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setValue("status", "DRAFT");
                  handleSubmit(onFormSubmit)();
                }}
                disabled={isLoading}
                className="flex items-center gap-2 font-body"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setValue("status", "SUBMITTED");
                  handleSubmit(onFormSubmit)();
                }}
                disabled={isLoading || Object.keys(validationErrors).length > 0}
                className="flex items-center gap-2 font-body"
              >
                <Send className="w-4 h-4" />
                Submit Report
              </Button>

              {Object.keys(validationErrors).length > 0 && (
                <div className="text-sm text-destructive font-body">
                  Please fix validation errors before submitting
                </div>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}