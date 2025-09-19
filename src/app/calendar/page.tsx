"use client";

import React, { useState } from "react";
import { CalendarView } from "@/components/CalendarView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Bell,
  Repeat,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const eventFormSchema = z.object({
  jobId: z.string().min(1, "Job is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  endDate: z.string().optional(),
  type: z.enum(["MEETING", "INSPECTION", "DEADLINE", "TASK", "REMINDER"]),
  location: z.enum(["FIELD", "SHOP", "OFFICE"]).optional(),
  attendees: z.array(z.string()).default([]),
  reminder: z.boolean().default(false),
  reminderMinutes: z.number().min(0).optional(),
  allDay: z.boolean().default(false),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface CalendarEvent {
  id: string;
  jobId: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  type: "MEETING" | "INSPECTION" | "DEADLINE" | "TASK" | "REMINDER";
  location?: "FIELD" | "SHOP" | "OFFICE";
  attendees: string[];
  reminder: boolean;
  allDay: boolean;
  job: {
    id: string;
    name: string;
    title: string;
    client: string;
    status: string;
  };
}

interface Job {
  id: string;
  name: string;
  title: string;
  client: string;
  status: string;
}

export default function CalendarPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      jobId: "",
      title: "",
      description: "",
      date: "",
      endDate: "",
      type: "MEETING",
      location: undefined,
      attendees: [],
      reminder: false,
      reminderMinutes: 15,
      allDay: false,
    },
  });

  const handleCreateEvent = (date: Date) => {
    setSelectedDate(date);
    form.reset({
      jobId: "",
      title: "",
      description: "",
      date: format(date, "yyyy-MM-dd'T'HH:mm"),
      endDate: "",
      type: "MEETING",
      location: undefined,
      attendees: [],
      reminder: false,
      reminderMinutes: 15,
      allDay: false,
    });
    setIsCreateModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    form.reset({
      jobId: event.jobId,
      title: event.title,
      description: event.description || "",
      date: format(new Date(event.date), "yyyy-MM-dd'T'HH:mm"),
      endDate: event.endDate ? format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm") : "",
      type: event.type,
      location: event.location,
      attendees: event.attendees,
      reminder: event.reminder,
      reminderMinutes: 15,
      allDay: event.allDay,
    });
    setIsEditModalOpen(true);
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      setLoading(true);
      const url = selectedEvent ? "/api/calendar/events" : "/api/calendar/events";
      const method = selectedEvent ? "PUT" : "POST";

      const payload = selectedEvent ? { ...data, id: selectedEvent.id } : data;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedEvent(null);
        // Refresh calendar data would happen here
        window.location.reload(); // Simple refresh for now
      } else {
        console.error("Error saving event:", result.error);
      }
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/calendar/events?id=${selectedEvent.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedEvent(null);
        // Refresh calendar data would happen here
        window.location.reload(); // Simple refresh for now
      } else {
        console.error("Error deleting event:", result.error);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-ds-4 py-ds-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-semibold">Shared Calendar</h1>
              <p className="text-muted-foreground font-body">
                Coordinate schedules and manage events across all jobs
              </p>
            </div>
            <div className="flex items-center gap-ds-2">
              <Badge variant="outline" className="font-body">
                Communication & Coordination Center
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <div className="container mx-auto px-ds-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-12">
              <TabsTrigger value="calendar" className="font-body">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar View
              </TabsTrigger>
              <TabsTrigger value="list" className="font-body">
                <Clock className="h-4 w-4 mr-2" />
                Event List
              </TabsTrigger>
              <TabsTrigger value="jobs" className="font-body">
                <MapPin className="h-4 w-4 mr-2" />
                Job Schedule
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="calendar" className="mt-0">
            <CalendarView
              onCreateEvent={handleCreateEvent}
              onEditEvent={handleEditEvent}
              userRole="PM" // This would come from auth context
            />
          </TabsContent>

          <TabsContent value="list" className="mt-0 p-ds-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-ds-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-ds-4 opacity-50" />
                  <p className="font-body">Event list view coming soon</p>
                  <p className="text-sm">Will show filtered and sorted events</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="mt-0 p-ds-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Job Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-ds-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-ds-4 opacity-50" />
                  <p className="font-body">Job schedule view coming soon</p>
                  <p className="text-sm">Will show timeline by job and crew</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Event Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Create New Event</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-ds-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-ds-4">
                {/* Job Selection */}
                <FormField
                  control={form.control}
                  name="jobId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body">Job *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a job" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="job1">Construction Site Alpha - ABC Corp</SelectItem>
                          <SelectItem value="job2">Renovation Project - XYZ Ltd</SelectItem>
                          <SelectItem value="job3">New Building - 123 Construction</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Event Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body">Event Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MEETING">Meeting</SelectItem>
                          <SelectItem value="INSPECTION">Inspection</SelectItem>
                          <SelectItem value="DEADLINE">Deadline</SelectItem>
                          <SelectItem value="TASK">Task</SelectItem>
                          <SelectItem value="REMINDER">Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-body">Event Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-body">Description</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter event description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-ds-4">
                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body">Start Date & Time *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Date */}
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body">End Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-ds-4">
                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body">Location</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FIELD">Field</SelectItem>
                          <SelectItem value="SHOP">Shop</SelectItem>
                          <SelectItem value="OFFICE">Office</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* All Day Toggle */}
                <FormField
                  control={form.control}
                  name="allDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body">All Day Event</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2 mt-2">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="rounded border border-input"
                          />
                          <span className="text-sm">This is an all-day event</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Reminder */}
              <FormField
                control={form.control}
                name="reminder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-body">Reminder</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border border-input"
                        />
                        <span className="text-sm">Send reminder notification</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-ds-2 pt-ds-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Event</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-ds-4">
              {/* Same form fields as create modal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-ds-4">
                <FormField
                  control={form.control}
                  name="jobId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body">Job *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a job" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="job1">Construction Site Alpha - ABC Corp</SelectItem>
                          <SelectItem value="job2">Renovation Project - XYZ Ltd</SelectItem>
                          <SelectItem value="job3">New Building - 123 Construction</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body">Event Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MEETING">Meeting</SelectItem>
                          <SelectItem value="INSPECTION">Inspection</SelectItem>
                          <SelectItem value="DEADLINE">Deadline</SelectItem>
                          <SelectItem value="TASK">Task</SelectItem>
                          <SelectItem value="REMINDER">Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-body">Event Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between gap-ds-2 pt-ds-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteEvent}
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete Event"}
                </Button>
                <div className="flex gap-ds-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}