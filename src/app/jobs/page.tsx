"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Users, Building2, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  name: string;
  description?: string;
  location: string;
  startDate: string;
  endDate?: string;
  status: string;
  crewAssignments: Array<{
    id: string;
    location: string;
    status: string;
    assignedAt: string;
  }>;
  _count: {
    crewAssignments: number;
  };
}

interface JobSelectionData {
  assignment: any;
  sessionData: {
    jobId: string;
    jobName: string;
    location: string;
    assignedAt: string;
  };
}

export default function JobSelectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<"FIELD" | "SHOP">("FIELD");
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchActiveJobs();
    }
  }, [status, router]);

  const fetchActiveJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/jobs/active");
      const result = await response.json();

      if (result.success) {
        setJobs(result.data);
      } else {
        console.error("Failed to fetch jobs:", result.error);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectJob = async (jobId: string) => {
    try {
      setSelecting(jobId);
      const response = await fetch("/api/jobs/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          location: selectedLocation,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const selectionData: JobSelectionData = result.data;

        // Store session data in localStorage for persistence
        localStorage.setItem("currentJob", JSON.stringify(selectionData.sessionData));

        // Navigate to job dashboard
        router.push(`/job/${jobId}`);
      } else {
        console.error("Failed to select job:", result.error);
        alert(result.error || "Failed to select job");
      }
    } catch (error) {
      console.error("Error selecting job:", error);
      alert("Failed to select job");
    } finally {
      setSelecting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getUserAssignment = (job: Job) => {
    return job.crewAssignments.length > 0 ? job.crewAssignments[0] : null;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground font-body">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-ds-3">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-ds-4">
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-ds-2">
              Select Your Job
            </h1>
            <p className="font-body text-muted-foreground">
              Choose your assigned job and work location to get started.
            </p>
          </div>

          {/* Location Selection */}
          <div className="mb-ds-4">
            <Tabs
              value={selectedLocation}
              onValueChange={(value) => setSelectedLocation(value as "FIELD" | "SHOP")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="FIELD" className="flex items-center gap-2">
                  <HardHat className="h-4 w-4" />
                  Field Work
                </TabsTrigger>
                <TabsTrigger value="SHOP" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Shop Work
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Jobs List */}
          <div className="space-y-ds-3">
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="py-ds-4 text-center">
                  <div className="text-muted-foreground font-body">
                    No active jobs available. Contact your supervisor for job assignments.
                  </div>
                </CardContent>
              </Card>
            ) : (
              jobs.map((job) => {
                const assignment = getUserAssignment(job);
                const isAssigned = !!assignment;

                return (
                  <Card
                    key={job.id}
                    className={cn(
                      "transition-all duration-200 hover:shadow-md",
                      isAssigned && "border-primary bg-primary/5"
                    )}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="font-heading text-xl flex items-center gap-2">
                            {job.name}
                            {isAssigned && (
                              <Badge variant="default" className="text-xs">
                                Assigned
                              </Badge>
                            )}
                          </CardTitle>
                          {job.description && (
                            <CardDescription className="font-body mt-1">
                              {job.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {job.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-ds-3 mb-ds-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="font-body">{job.location}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="font-body">
                            {formatDate(job.startDate)}
                            {job.endDate && ` - ${formatDate(job.endDate)}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="font-body">
                            {job._count.crewAssignments} crew member{job._count.crewAssignments !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {isAssigned && (
                        <div className="mb-ds-3 p-ds-2 bg-muted rounded-md">
                          <p className="text-sm font-body text-muted-foreground">
                            Currently assigned to: <span className="font-medium text-foreground">{assignment.location}</span>
                          </p>
                          <p className="text-xs font-body text-muted-foreground">
                            Assigned on {formatDate(assignment.assignedAt)}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="text-sm font-body text-muted-foreground">
                          Will work at: <span className="font-medium text-foreground">{selectedLocation}</span>
                        </div>

                        <Button
                          onClick={() => selectJob(job.id)}
                          disabled={selecting === job.id}
                          className="font-body"
                        >
                          {selecting === job.id ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                              Selecting...
                            </>
                          ) : isAssigned ? (
                            "Switch Location"
                          ) : (
                            "Select Job"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}