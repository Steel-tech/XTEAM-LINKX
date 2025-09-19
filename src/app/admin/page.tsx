"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { JobOverview } from "@/components/JobOverview";
import { CrewStatus } from "@/components/CrewStatus";
import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  Activity,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Calendar,
  MessageSquare
} from "lucide-react";

interface DashboardData {
  jobs: any[];
  summary: {
    totalActiveJobs: number;
    totalFieldWorkers: number;
    totalShopWorkers: number;
    jobsOnSchedule: number;
    jobsBehindSchedule: number;
  };
}

interface CrewData {
  id: string;
  name: string;
  type: "FIELD" | "SHOP";
  foreman?: {
    id: string;
    name: string;
    location?: string;
  };
  memberCount: number;
  members: Array<{
    id: string;
    name: string;
    location?: string;
    isOnline?: boolean;
  }>;
  jobId: string;
  jobName: string;
  status: "active" | "offline" | "break";
  lastActivity?: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Check authentication and role
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      redirect("/api/auth/signin");
      return;
    }
  }, [status]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/jobs");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch dashboard data");
      }

      setDashboardData(result.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time updates simulation (in production, this would be WebSocket)
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  // Transform jobs data into crew data
  const extractCrewData = (jobs: any[]): CrewData[] => {
    const crews: CrewData[] = [];

    jobs.forEach(job => {
      // Add field crews
      job.fieldCrews?.forEach((crew: any) => {
        crews.push({
          id: crew.id,
          name: crew.name,
          type: "FIELD",
          foreman: crew.foreman,
          memberCount: crew.memberCount,
          members: crew.members?.map((member: any) => ({
            ...member,
            isOnline: Math.random() > 0.3 // Simulate online status
          })) || [],
          jobId: job.id,
          jobName: job.title,
          status: Math.random() > 0.8 ? "break" : "active",
          lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString()
        });
      });

      // Add shop crews
      job.shopCrews?.forEach((crew: any) => {
        crews.push({
          id: crew.id,
          name: crew.name,
          type: "SHOP",
          foreman: crew.foreman,
          memberCount: crew.memberCount,
          members: crew.members?.map((member: any) => ({
            ...member,
            isOnline: Math.random() > 0.2 // Shop workers more likely to be online
          })) || [],
          jobId: job.id,
          jobName: job.title,
          status: Math.random() > 0.9 ? "break" : "active",
          lastActivity: new Date(Date.now() - Math.random() * 1800000).toISOString()
        });
      });
    });

    return crews;
  };

  const handleJobSelect = (jobId: string) => {
    console.log("Selected job:", jobId);
    // In production, navigate to job detail page
  };

  const handleCrewSelect = (crewId: string) => {
    console.log("Selected crew:", crewId);
    // In production, open crew detail modal or navigate to crew page
  };

  const handleMessageCrew = (crewId: string) => {
    console.log("Message crew:", crewId);
    // In production, open messaging interface
  };

  const handleCallCrew = (crewId: string) => {
    console.log("Call crew:", crewId);
    // In production, initiate voice/video call
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-ds-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="font-body text-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-heading text-destructive flex items-center gap-ds-2">
              <AlertTriangle className="h-5 w-5" />
              Access Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-ds-3">
            <p className="font-body text-muted-foreground">{error}</p>
            <div className="flex gap-ds-2">
              <Button onClick={fetchDashboardData} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-ds-1" />
                Retry
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/"}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const crewData = dashboardData ? extractCrewData(dashboardData.jobs) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-ds-4 py-ds-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">
                Admin Dashboard
              </h1>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Multi-job overview and crew coordination
              </p>
            </div>
            <div className="flex items-center gap-ds-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRealTimeUpdates(!realTimeUpdates)}
                className={cn(
                  "font-body",
                  realTimeUpdates && "bg-primary text-primary-foreground"
                )}
              >
                <Activity className="h-4 w-4 mr-ds-1" />
                Live Updates
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboardData}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-ds-1", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      {dashboardData && (
        <div className="container mx-auto px-ds-4 py-ds-4">
          <div className="grid gap-ds-4 md:grid-cols-2 lg:grid-cols-5 mb-ds-6">
            <Card>
              <CardContent className="p-ds-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm text-muted-foreground">Active Jobs</p>
                    <p className="font-heading text-2xl font-semibold text-foreground">
                      {dashboardData.summary.totalActiveJobs}
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-ds-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm text-muted-foreground">Field Workers</p>
                    <p className="font-heading text-2xl font-semibold text-foreground">
                      {dashboardData.summary.totalFieldWorkers}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-ds-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm text-muted-foreground">Shop Workers</p>
                    <p className="font-heading text-2xl font-semibold text-foreground">
                      {dashboardData.summary.totalShopWorkers}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-ds-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm text-muted-foreground">On Schedule</p>
                    <p className="font-heading text-2xl font-semibold text-success">
                      {dashboardData.summary.jobsOnSchedule}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-ds-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm text-muted-foreground">Behind Schedule</p>
                    <p className="font-heading text-2xl font-semibold text-warning">
                      {dashboardData.summary.jobsBehindSchedule}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-ds-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="font-body">
                Job Overview
              </TabsTrigger>
              <TabsTrigger value="crews" className="font-body">
                Crew Status
              </TabsTrigger>
              <TabsTrigger value="activity" className="font-body">
                Recent Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-ds-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  Active Jobs Overview
                </h2>
                <div className="flex gap-ds-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-ds-1" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-ds-1" />
                    New Job
                  </Button>
                </div>
              </div>
              <JobOverview
                jobs={dashboardData.jobs}
                onJobSelect={handleJobSelect}
              />
            </TabsContent>

            <TabsContent value="crews" className="space-y-ds-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  Crew Status & Locations
                </h2>
                <div className="flex gap-ds-2">
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-ds-1" />
                    Search
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-ds-1" />
                    Assign Crew
                  </Button>
                </div>
              </div>
              <CrewStatus
                crews={crewData}
                onCrewSelect={handleCrewSelect}
                onMessageCrew={handleMessageCrew}
                onCallCrew={handleCallCrew}
                realTimeUpdates={realTimeUpdates}
              />
            </TabsContent>

            <TabsContent value="activity" className="space-y-ds-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  Recent Activity
                </h2>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-ds-1" />
                  View Calendar
                </Button>
              </div>
              <div className="grid gap-ds-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-base flex items-center gap-ds-2">
                      <MessageSquare className="h-4 w-4" />
                      Recent Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-ds-2">
                    {dashboardData.jobs.slice(0, 3).map((job, index) => (
                      <div key={index} className="space-y-ds-1">
                        {job.recentActivity?.slice(0, 2).map((activity: any, actIndex: number) => (
                          <div key={actIndex} className="flex justify-between items-start text-sm">
                            <div className="flex-1">
                              <p className="font-body text-foreground">
                                <span className="font-medium">{activity.sender}:</span> {activity.content}
                              </p>
                              <p className="font-body text-xs text-muted-foreground">
                                {job.title}
                              </p>
                            </div>
                            <span className="font-body text-xs text-muted-foreground">
                              {new Date(activity.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-base flex items-center gap-ds-2">
                      <Calendar className="h-4 w-4" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-ds-2">
                    {dashboardData.jobs.slice(0, 3).map((job, index) => (
                      <div key={index} className="space-y-ds-1">
                        {job.upcomingEvents?.slice(0, 2).map((event: any, eventIndex: number) => (
                          <div key={eventIndex} className="flex justify-between items-start text-sm">
                            <div className="flex-1">
                              <p className="font-body text-foreground font-medium">{event.title}</p>
                              <p className="font-body text-xs text-muted-foreground">
                                {job.title} • {event.type}
                              </p>
                            </div>
                            <span className="font-body text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}