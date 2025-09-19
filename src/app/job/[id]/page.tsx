"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Building2, HardHat, ArrowLeft, Clock, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobSession {
  jobId: string;
  jobName: string;
  location: string;
  assignedAt: string;
}

export default function JobDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [jobSession, setJobSession] = useState<JobSession | null>(null);
  const [loading, setLoading] = useState(true);

  const loadJobSession = useCallback(() => {
    try {
      const storedSession = localStorage.getItem("currentJob");
      if (storedSession) {
        const sessionData: JobSession = JSON.parse(storedSession);

        // Verify this matches the current job ID
        if (sessionData.jobId === jobId) {
          setJobSession(sessionData);
        } else {
          // Job ID mismatch, redirect to job selection
          router.push("/jobs");
          return;
        }
      } else {
        // No session data, redirect to job selection
        router.push("/jobs");
        return;
      }
    } catch (error) {
      console.error("Error loading job session:", error);
      router.push("/jobs");
      return;
    } finally {
      setLoading(false);
    }
  }, [jobId, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
      return;
    }

    if (status === "authenticated") {
      loadJobSession();
    }
  }, [status, loadJobSession, router]);

  const switchJob = () => {
    localStorage.removeItem("currentJob");
    router.push("/jobs");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLocationIcon = (location: string) => {
    return location === "FIELD" ? HardHat : Building2;
  };

  const getLocationColor = (location: string) => {
    return location === "FIELD" ? "text-primary" : "text-secondary";
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground font-body">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!jobSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground font-body mb-4">No job session found</p>
          <Button onClick={() => router.push("/jobs")}>Select Job</Button>
        </div>
      </div>
    );
  }

  const LocationIcon = getLocationIcon(jobSession.location);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-ds-3">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-ds-4">
            <div className="flex items-center gap-ds-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/jobs")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="font-heading text-3xl font-semibold text-foreground">
                  {jobSession.jobName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <LocationIcon className={cn("h-4 w-4", getLocationColor(jobSession.location))} />
                  <span className="font-body text-muted-foreground">
                    Working at {jobSession.location}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-body text-muted-foreground text-sm">
                    Started {formatDate(jobSession.assignedAt)}
                  </span>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={switchJob}>
              Switch Job
            </Button>
          </div>

          {/* Status Card */}
          <Card className="mb-ds-4 border-primary bg-primary/5">
            <CardContent className="pt-ds-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-ds-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <LocationIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-heading font-medium text-foreground">
                      You are assigned to {jobSession.location} work
                    </p>
                    <p className="font-body text-sm text-muted-foreground">
                      Active since {formatDate(jobSession.assignedAt)}
                    </p>
                  </div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-ds-3 mb-ds-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-ds-2">
                <div className="flex items-center justify-between">
                  <Clock className="h-8 w-8 text-primary" />
                  <span className="text-xs font-body text-muted-foreground">Time Tracking</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="font-heading text-lg mb-1">Clock In/Out</CardTitle>
                <CardDescription className="font-body text-sm">
                  Track your work hours for this job
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-ds-2">
                <div className="flex items-center justify-between">
                  <Image className="h-8 w-8 text-primary" aria-label="Blueprints" />
                  <span className="text-xs font-body text-muted-foreground">Blueprints</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="font-heading text-lg mb-1">View Blueprints</CardTitle>
                <CardDescription className="font-body text-sm">
                  Access job blueprints and add markups
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-ds-2">
                <div className="flex items-center justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="text-xs font-body text-muted-foreground">Reports</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="font-heading text-lg mb-1">Daily Reports</CardTitle>
                <CardDescription className="font-body text-sm">
                  Submit inspections, NCRs, and safety reports
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-ds-2">
                <div className="flex items-center justify-between">
                  <MapPin className="h-8 w-8 text-primary" />
                  <span className="text-xs font-body text-muted-foreground">Job Info</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="font-heading text-lg mb-1">Job Details</CardTitle>
                <CardDescription className="font-body text-sm">
                  View job information and requirements
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Quick Actions</CardTitle>
              <CardDescription className="font-body">
                Common tasks for {jobSession.location.toLowerCase()} workers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-ds-2">
                <Button variant="outline" className="font-body">
                  Clock In
                </Button>
                <Button variant="outline" className="font-body">
                  View Blueprints
                </Button>
                <Button variant="outline" className="font-body">
                  Submit Report
                </Button>
                <Button variant="outline" className="font-body">
                  Take Photo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}