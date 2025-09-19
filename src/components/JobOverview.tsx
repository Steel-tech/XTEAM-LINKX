"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MessageSquare
} from "lucide-react";

interface JobData {
  id: string;
  name: string;
  title: string;
  client: string;
  location?: string;
  status: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  fieldCrews: Array<{
    id: string;
    name: string;
    foreman?: { name: string };
    memberCount: number;
  }>;
  shopCrews: Array<{
    id: string;
    name: string;
    foreman?: { name: string };
    memberCount: number;
  }>;
  totalFieldWorkers: number;
  totalShopWorkers: number;
  recentActivity: Array<{
    id: string;
    content: string;
    sender: string;
    createdAt: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
  }>;
  progressIndicators: {
    fieldProgress: number;
    shopProgress: number;
    onSchedule: boolean;
    budgetStatus: string;
  };
  lastUpdated: string;
}

interface JobOverviewProps {
  jobs: JobData[];
  onJobSelect?: (jobId: string) => void;
  className?: string;
}

export function JobOverview({ jobs, onJobSelect, className }: JobOverviewProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent": return "destructive";
      case "high": return "secondary";
      case "medium": return "outline";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "default";
      case "COMPLETE": return "secondary";
      case "ON_HOLD": return "destructive";
      default: return "outline";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center p-ds-6 text-center">
        <div className="space-y-ds-2">
          <div className="text-muted-foreground font-body">No active jobs found</div>
          <p className="text-sm text-muted-foreground font-body">
            Create a new job to get started with crew management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-ds-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {jobs.map((job) => (
        <Card
          key={job.id}
          className="bg-card hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onJobSelect?.(job.id)}
        >
          <CardHeader className="p-ds-3">
            <div className="flex items-start justify-between gap-ds-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="font-heading text-lg truncate text-foreground">
                  {job.title}
                </CardTitle>
                <p className="font-body text-sm text-muted-foreground mt-1 truncate">
                  {job.client}
                </p>
              </div>
              <div className="flex gap-ds-1 flex-wrap">
                <Badge variant={getStatusColor(job.status)} className="text-xs">
                  {job.status}
                </Badge>
                <Badge variant={getPriorityColor(job.priority)} className="text-xs">
                  {job.priority}
                </Badge>
              </div>
            </div>

            {job.location && (
              <div className="flex items-center gap-ds-1 text-sm text-muted-foreground font-body">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{job.location}</span>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-ds-3 pt-0 space-y-ds-3">
            {/* Crew Summary */}
            <div className="grid grid-cols-2 gap-ds-3">
              <div className="space-y-ds-1">
                <div className="flex items-center gap-ds-1">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-body text-sm font-medium text-foreground">Field</span>
                </div>
                <div className="space-y-1">
                  <div className="font-body text-xs text-muted-foreground">
                    {job.fieldCrews.length} crews • {job.totalFieldWorkers} workers
                  </div>
                  <div className="w-full bg-muted h-2 rounded-sm">
                    <div
                      className="bg-primary h-2 rounded-sm transition-all"
                      style={{ width: `${job.progressIndicators.fieldProgress}%` }}
                    />
                  </div>
                  <div className="font-body text-xs text-muted-foreground">
                    {job.progressIndicators.fieldProgress}% complete
                  </div>
                </div>
              </div>

              <div className="space-y-ds-1">
                <div className="flex items-center gap-ds-1">
                  <Users className="h-4 w-4 text-secondary" />
                  <span className="font-body text-sm font-medium text-foreground">Shop</span>
                </div>
                <div className="space-y-1">
                  <div className="font-body text-xs text-muted-foreground">
                    {job.shopCrews.length} crews • {job.totalShopWorkers} workers
                  </div>
                  <div className="w-full bg-muted h-2 rounded-sm">
                    <div
                      className="bg-secondary h-2 rounded-sm transition-all"
                      style={{ width: `${job.progressIndicators.shopProgress}%` }}
                    />
                  </div>
                  <div className="font-body text-xs text-muted-foreground">
                    {job.progressIndicators.shopProgress}% complete
                  </div>
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-ds-2 flex-wrap">
              <div className="flex items-center gap-ds-1">
                {job.progressIndicators.onSchedule ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                )}
                <span className="font-body text-xs text-muted-foreground">
                  {job.progressIndicators.onSchedule ? "On Schedule" : "Behind Schedule"}
                </span>
              </div>

              <div className="flex items-center gap-ds-1">
                <TrendingUp className={cn(
                  "h-4 w-4",
                  job.progressIndicators.budgetStatus === "on-track" ? "text-success" : "text-warning"
                )} />
                <span className="font-body text-xs text-muted-foreground">
                  {job.progressIndicators.budgetStatus === "on-track" ? "On Budget" : "Over Budget"}
                </span>
              </div>
            </div>

            {/* Timeline */}
            {(job.startDate || job.endDate) && (
              <div className="flex items-center gap-ds-2 text-xs text-muted-foreground font-body">
                <Clock className="h-4 w-4" />
                <span>
                  {formatDate(job.startDate)} - {formatDate(job.endDate)}
                </span>
              </div>
            )}

            {/* Recent Activity Preview */}
            {job.recentActivity.length > 0 && (
              <div className="space-y-ds-1">
                <div className="flex items-center gap-ds-1">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="font-body text-xs font-medium text-foreground">Recent Activity</span>
                </div>
                <div className="space-y-1">
                  {job.recentActivity.slice(0, 2).map((activity) => (
                    <div key={activity.id} className="text-xs text-muted-foreground font-body">
                      <span className="font-medium">{activity.sender}:</span> {activity.content}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            {job.upcomingEvents.length > 0 && (
              <div className="space-y-ds-1">
                <div className="flex items-center gap-ds-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-body text-xs font-medium text-foreground">Upcoming</span>
                </div>
                <div className="space-y-1">
                  {job.upcomingEvents.slice(0, 2).map((event) => (
                    <div key={event.id} className="flex justify-between text-xs font-body">
                      <span className="text-foreground truncate">{event.title}</span>
                      <span className="text-muted-foreground">
                        {formatTime(event.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-ds-2 pt-ds-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 font-body"
                onClick={(e) => {
                  e.stopPropagation();
                  onJobSelect?.(job.id);
                }}
              >
                View Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="font-body"
                onClick={(e) => e.stopPropagation()}
              >
                Message
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}