"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";

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
  startDate?: string;
  endDate?: string;
  _count: {
    events: number;
    members: number;
  };
}

interface CalendarViewProps {
  onCreateEvent?: (date: Date) => void;
  onEditEvent?: (event: CalendarEvent) => void;
  userRole?: string;
}

export function CalendarView({ onCreateEvent, onEditEvent, userRole = "FIELD" }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Event type colors
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "MEETING": return "bg-primary";
      case "INSPECTION": return "bg-warning";
      case "DEADLINE": return "bg-destructive";
      case "TASK": return "bg-success";
      case "REMINDER": return "bg-accent";
      default: return "bg-muted";
    }
  };

  const getEventTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "DEADLINE": return "destructive";
      case "MEETING": return "default";
      case "INSPECTION": return "secondary";
      default: return "outline";
    }
  };

  // Fetch jobs for filtering
  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/calendar/jobs");
      const result = await response.json();
      if (result.success) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  // Fetch events for current month
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (selectedJob !== "all") {
        params.append("jobId", selectedJob);
      }

      if (selectedType !== "all") {
        params.append("type", selectedType);
      }

      const response = await fetch(`/api/calendar/events?${params}`);
      const result = await response.json();

      if (result.success) {
        setEvents(result.data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, selectedJob, selectedType]);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Get events for selected date
  const selectedDateEvents = events.filter(event =>
    isSameDay(parseISO(event.date), selectedDate)
  );

  // Get events for calendar days (for day indicators)
  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(parseISO(event.date), date));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-ds-4 p-ds-4">
      {/* Calendar Section */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-xl">
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <div className="flex items-center gap-ds-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMonthChange("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMonthChange("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-ds-2 pt-ds-2">
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.name} - {job.client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="MEETING">Meetings</SelectItem>
                  <SelectItem value="INSPECTION">Inspections</SelectItem>
                  <SelectItem value="DEADLINE">Deadlines</SelectItem>
                  <SelectItem value="TASK">Tasks</SelectItem>
                  <SelectItem value="REMINDER">Reminders</SelectItem>
                </SelectContent>
              </Select>

              {(userRole === "PM" || userRole === "ADMIN" || userRole === "FOREMAN") && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Event</DialogTitle>
                    </DialogHeader>
                    <div className="p-ds-4">
                      {/* Event creation form would go here */}
                      <p className="text-muted-foreground">
                        Event creation form will be implemented in the calendar page.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="w-full"
              components={{
                DayButton: ({ day, ...props }) => {
                  const dayEvents = getEventsForDate(day.date);
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <Button
                      {...props}
                      variant={isSameDay(day.date, selectedDate) ? "default" : "ghost"}
                      className={cn(
                        "h-12 w-12 p-0 font-body relative",
                        hasEvents && "border-primary border-2",
                        isSameDay(day.date, selectedDate) && "bg-primary text-primary-foreground"
                      )}
                    >
                      <span>{day.date.getDate()}</span>
                      {hasEvents && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((event, index) => (
                            <div
                              key={index}
                              className={cn(
                                "w-1 h-1 rounded-full",
                                getEventTypeColor(event.type)
                              )}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs">+</div>
                          )}
                        </div>
                      )}
                    </Button>
                  );
                },
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Events Sidebar */}
      <div className="space-y-ds-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-ds-2">
              <CalendarDays className="h-5 w-5" />
              {format(selectedDate, "MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-ds-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : selectedDateEvents.length > 0 ? (
              <div className="space-y-ds-3">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border rounded p-ds-3 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onEditEvent?.(event)}
                  >
                    <div className="flex items-start justify-between mb-ds-1">
                      <h4 className="font-heading font-medium text-sm">
                        {event.title}
                      </h4>
                      <Badge variant={getEventTypeBadgeVariant(event.type)}>
                        {event.type}
                      </Badge>
                    </div>

                    <div className="space-y-ds-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-ds-1">
                        <Clock className="h-3 w-3" />
                        {event.allDay ? (
                          "All day"
                        ) : (
                          format(parseISO(event.date), "h:mm a")
                        )}
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-ds-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}

                      {event.attendees.length > 0 && (
                        <div className="flex items-center gap-ds-1">
                          <Users className="h-3 w-3" />
                          {event.attendees.length} attendees
                        </div>
                      )}

                      <div className="text-xs font-medium text-primary">
                        {event.job.name} - {event.job.client}
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-ds-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-ds-4 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-ds-2 opacity-50" />
                <p className="text-sm">No events scheduled</p>
                {(userRole === "PM" || userRole === "ADMIN" || userRole === "FOREMAN") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-ds-2"
                    onClick={() => onCreateEvent?.(selectedDate)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Event
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-sm">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-ds-2">
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className={cn(
                    "p-ds-2 rounded border cursor-pointer transition-colors",
                    selectedJob === job.id ? "bg-primary/10 border-primary" : "hover:bg-accent"
                  )}
                  onClick={() => setSelectedJob(job.id)}
                >
                  <div className="text-xs font-medium">{job.name}</div>
                  <div className="text-xs text-muted-foreground">{job.client}</div>
                  <div className="text-xs text-muted-foreground mt-ds-1">
                    {job._count.events} events • {job._count.members} members
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}