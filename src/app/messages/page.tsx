"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChatInterface } from "@/components/ChatInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Briefcase, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  name: string;
  status: string;
  priority: string;
  client: string;
  location?: string;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Load user's jobs
  useEffect(() => {
    if (!session?.user?.id) return;

    const loadJobs = async () => {
      try {
        const response = await fetch("/api/jobs");
        if (response.ok) {
          const data = await response.json();
          setJobs(data.jobs || []);
          // Auto-select first job if available
          if (data.jobs?.length > 0) {
            setSelectedJobId(data.jobs[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading jobs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
  }, [session?.user?.id]);

  const selectedJob = jobs.find((job) => job.id === selectedJobId);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-warning text-warning-foreground";
      case "medium":
        return "bg-primary text-primary-foreground";
      case "low":
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-success text-success-foreground";
      case "COMPLETE":
        return "bg-muted text-muted-foreground";
      case "ON_HOLD":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto px-ds-4 py-ds-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-ds-6">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-ds-4" />
                <h3 className="text-lg font-heading font-semibold">Access Required</h3>
                <p className="text-muted-foreground mt-ds-2">
                  Please sign in to access the messaging system.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-ds-4 py-ds-6">
      <div className="space-y-ds-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-semibold text-foreground">
              Team Messages
            </h1>
            <p className="text-muted-foreground mt-ds-1">
              Real-time communication with your field teams
            </p>
          </div>

          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-ds-1" />
            New Channel
          </Button>
        </div>

        {/* Job Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-ds-2 font-heading text-lg">
              <Briefcase className="w-5 h-5" />
              Select Job Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-ds-4">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-md bg-muted h-10 w-64"></div>
                </div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-ds-6">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-ds-4" />
                <h3 className="text-lg font-heading font-semibold">No Jobs Found</h3>
                <p className="text-muted-foreground mt-ds-2">
                  You are not assigned to any jobs yet.
                </p>
              </div>
            ) : (
              <div className="space-y-ds-3">
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a job to chat about..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        <div className="flex items-center gap-ds-2">
                          <span className="font-medium">{job.title}</span>
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", getPriorityColor(job.priority))}
                          >
                            {job.priority}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedJob && (
                  <div className="flex items-center gap-ds-3 p-ds-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium font-heading">{selectedJob.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedJob.client} • {selectedJob.location || "No location"}
                      </p>
                    </div>
                    <div className="flex gap-ds-2">
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", getStatusColor(selectedJob.status))}
                      >
                        {selectedJob.status}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", getPriorityColor(selectedJob.priority))}
                      >
                        {selectedJob.priority}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        {selectedJobId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-ds-6">
            <div className="lg:col-span-2">
              <ChatInterface jobId={selectedJobId} className="h-[600px]" />
            </div>

            {/* Job Details Sidebar */}
            <div className="space-y-ds-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-ds-3">
                  {selectedJob && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Job Name</label>
                        <p className="font-body">{selectedJob.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Client</label>
                        <p className="font-body">{selectedJob.client}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                        <p className="font-body">{selectedJob.location || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="mt-1">
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", getStatusColor(selectedJob.status))}
                          >
                            {selectedJob.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Priority</label>
                        <div className="mt-1">
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", getPriorityColor(selectedJob.priority))}
                          >
                            {selectedJob.priority}
                          </Badge>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}