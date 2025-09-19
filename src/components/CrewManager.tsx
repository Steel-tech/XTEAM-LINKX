"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Users, MapPin, Clock, TrendingUp, AlertCircle, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  location?: string | null;
}

interface Crew {
  id: string;
  name: string;
  type: string;
  active: boolean;
  foreman?: User | null;
  members: Array<{
    id: string;
    user: User;
  }>;
  assignments: Array<{
    id: string;
    location: string;
    assignedAt: Date;
    job?: {
      id: string;
      name: string;
      client: string;
    };
  }>;
  metrics?: {
    activeJobs: number;
    memberCount: number;
    availability: string;
    currentAssignments: Array<{
      jobName?: string;
      location: string;
      assignedAt: Date;
    }>;
  };
}

interface Job {
  id: string;
  name: string;
  title: string;
  client: string;
  status: string;
  location?: string | null;
}

interface CrewManagerProps {
  className?: string;
}

const CrewManager = ({ className }: CrewManagerProps) => {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedCrewType, setSelectedCrewType] = useState<string>("all");
  const [draggedCrew, setDraggedCrew] = useState<string | null>(null);
  const [dragOverJob, setDragOverJob] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    fetchCrews();
    fetchJobs();
  }, []);

  const fetchCrews = async () => {
    try {
      const response = await fetch("/api/crews?includePerformance=true");
      const data = await response.json();

      if (data.success) {
        setCrews(data.crews);
      } else {
        throw new Error("Failed to fetch crews");
      }
    } catch (err) {
      setError("Failed to load crews");
      console.error("Error fetching crews:", err);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs?status=ACTIVE");
      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const assignCrewToJob = async (crewId: string, jobId: string, location: string = "FIELD") => {
    try {
      const response = await fetch("/api/crews/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crewId,
          jobId,
          location,
          action: "assign",
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchCrews(); // Refresh crew data
        return true;
      } else {
        throw new Error(data.error || "Assignment failed");
      }
    } catch (err) {
      setError(`Failed to assign crew: ${err instanceof Error ? err.message : "Unknown error"}`);
      return false;
    }
  };

  const unassignCrewFromJob = async (crewId: string, jobId: string) => {
    try {
      const response = await fetch("/api/crews/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crewId,
          jobId,
          action: "unassign",
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchCrews();
        return true;
      } else {
        throw new Error(data.error || "Unassignment failed");
      }
    } catch (err) {
      setError(`Failed to unassign crew: ${err instanceof Error ? err.message : "Unknown error"}`);
      return false;
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, crewId: string) => {
    setDraggedCrew(crewId);
    e.dataTransfer.setData("text/plain", crewId);
  };

  const handleDragOver = (e: React.DragEvent, jobId: string) => {
    e.preventDefault();
    setDragOverJob(jobId);
  };

  const handleDragLeave = () => {
    setDragOverJob(null);
  };

  const handleDrop = async (e: React.DragEvent, jobId: string) => {
    e.preventDefault();
    const crewId = e.dataTransfer.getData("text/plain");

    if (crewId && jobId) {
      await assignCrewToJob(crewId, jobId);
    }

    setDraggedCrew(null);
    setDragOverJob(null);
  };

  // Filter crews based on type
  const filteredCrews = crews.filter(crew =>
    selectedCrewType === "all" || crew.type === selectedCrewType
  );

  const availableCrews = filteredCrews.filter(crew =>
    crew.active && crew.metrics?.availability === "available"
  );

  const assignedCrews = filteredCrews.filter(crew =>
    crew.active && crew.metrics?.availability === "assigned"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading crew management...</div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-ds-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">Crew Management</h2>
          <p className="text-muted-foreground mt-ds-1">
            Assign teams to jobs, track performance, and manage workforce
          </p>
        </div>

        <div className="flex items-center gap-ds-2">
          <Select value={selectedCrewType} onValueChange={setSelectedCrewType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter crews" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crews</SelectItem>
              <SelectItem value="FIELD">Field Crews</SelectItem>
              <SelectItem value="SHOP">Shop Crews</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-ds-1" />
            New Crew
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive/20 rounded-md p-ds-3"
        >
          <div className="flex items-center gap-ds-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="font-body text-sm">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto"
            >
              Dismiss
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-ds-6">
        {/* Available Crews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-ds-2">
              <Users className="h-5 w-5 text-success" />
              Available Crews
              <Badge variant="secondary">{availableCrews.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-ds-3">
            <AnimatePresence>
              {availableCrews.map((crew) => (
                <motion.div
                  key={crew.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, crew.id)}
                  className={cn(
                    "p-ds-3 rounded-lg border bg-card cursor-move transition-all",
                    "hover:shadow-md hover:border-primary/50",
                    draggedCrew === crew.id && "opacity-50 scale-95"
                  )}
                >
                  <div className="flex items-center justify-between mb-ds-2">
                    <h4 className="font-heading font-medium text-card-foreground">
                      {crew.name}
                    </h4>
                    <Badge variant={crew.type === "FIELD" ? "default" : "secondary"}>
                      {crew.type}
                    </Badge>
                  </div>

                  <div className="space-y-ds-1">
                    <div className="flex items-center gap-ds-2 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{crew.metrics?.memberCount || 0} members</span>
                    </div>

                    {crew.foreman && (
                      <div className="flex items-center gap-ds-2 text-sm text-muted-foreground">
                        <Settings className="h-3 w-3" />
                        <span>Foreman: {crew.foreman.name}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {availableCrews.length === 0 && (
              <div className="text-center py-ds-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-ds-2 opacity-50" />
                <p className="text-sm">No available crews</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-ds-2">
              <MapPin className="h-5 w-5 text-primary" />
              Active Jobs
              <Badge variant="default">{jobs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-ds-3">
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                layout
                onDragOver={(e) => handleDragOver(e, job.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, job.id)}
                className={cn(
                  "p-ds-3 rounded-lg border bg-card transition-all",
                  "hover:shadow-md",
                  dragOverJob === job.id && "border-primary bg-primary/5 shadow-lg"
                )}
              >
                <div className="space-y-ds-2">
                  <h4 className="font-heading font-medium text-card-foreground">
                    {job.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Client: {job.client}
                  </p>
                  {job.location && (
                    <div className="flex items-center gap-ds-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{job.location}</span>
                    </div>
                  )}

                  {/* Assigned crews for this job */}
                  <div className="space-y-ds-1">
                    {assignedCrews
                      .filter(crew => crew.assignments.some(a => a.job?.id === job.id))
                      .map(crew => (
                        <div key={crew.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{crew.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unassignCrewFromJob(crew.id, job.id)}
                            className="h-6 px-ds-2 text-xs"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            ))}

            {jobs.length === 0 && (
              <div className="text-center py-ds-6 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-ds-2 opacity-50" />
                <p className="text-sm">No active jobs</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Crews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-ds-2">
              <Clock className="h-5 w-5 text-warning" />
              Assigned Crews
              <Badge variant="outline">{assignedCrews.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-ds-3">
            <AnimatePresence>
              {assignedCrews.map((crew) => (
                <motion.div
                  key={crew.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-ds-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between mb-ds-2">
                    <h4 className="font-heading font-medium text-card-foreground">
                      {crew.name}
                    </h4>
                    <Badge variant={crew.type === "FIELD" ? "default" : "secondary"}>
                      {crew.type}
                    </Badge>
                  </div>

                  <div className="space-y-ds-2">
                    {crew.metrics?.currentAssignments.map((assignment, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="flex items-center gap-ds-2 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{assignment.jobName || "Unknown Job"}</span>
                        </div>
                        <div className="flex items-center gap-ds-2 text-xs text-muted-foreground ml-5">
                          <span>{assignment.location}</span>
                          <span>•</span>
                          <span>
                            {new Date(assignment.assignedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center gap-ds-2 text-sm text-muted-foreground pt-ds-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{crew.metrics?.memberCount || 0} members</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {assignedCrews.length === 0 && (
              <div className="text-center py-ds-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-ds-2 opacity-50" />
                <p className="text-sm">No assigned crews</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-ds-4">
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-primary">
                {filteredCrews.filter(c => c.active).length}
              </div>
              <div className="text-sm text-muted-foreground">Total Active Crews</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-success">
                {availableCrews.length}
              </div>
              <div className="text-sm text-muted-foreground">Available Crews</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-warning">
                {assignedCrews.length}
              </div>
              <div className="text-sm text-muted-foreground">Assigned Crews</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-accent">
                {Math.round(((assignedCrews.length / Math.max(filteredCrews.filter(c => c.active).length, 1)) * 100))}%
              </div>
              <div className="text-sm text-muted-foreground">Utilization Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrewManager;