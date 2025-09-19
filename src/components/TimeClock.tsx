"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, User, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Job {
  id: string;
  name: string;
  location: string;
  status: string;
  crewAssignments: {
    id: string;
    location: string;
    status: string;
    assignedAt: string;
  }[];
}

interface TimeEntry {
  id: string;
  jobId: string;
  location: string;
  clockIn: string;
  clockOut?: string;
  duration?: number;
}

interface TimeClockProps {
  userId?: string;
  className?: string;
}

export function TimeClock({ userId, className }: TimeClockProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<"FIELD" | "SHOP">("FIELD");
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load active jobs
  useEffect(() => {
    loadJobs();
  }, []);

  const checkActiveTimeEntry = useCallback(async () => {
    try {
      const response = await fetch("/api/time/entries?limit=1");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCurrentEntry(data.data);
          setSelectedJob(data.data.jobId);
          setSelectedLocation(data.data.location);
        }
      }
    } catch (error) {
      console.error("Error checking active time entry:", error);
    }
  }, []);

  // Check for active time entry when jobs are loaded
  useEffect(() => {
    if (jobs.length > 0) {
      checkActiveTimeEntry();
    }
  }, [jobs, checkActiveTimeEntry]);

  const loadJobs = async () => {
    try {
      const response = await fetch("/api/jobs/active");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter to only show jobs where user is assigned
          const assignedJobs = data.data.filter((job: Job) =>
            job.crewAssignments && job.crewAssignments.length > 0 &&
            job.crewAssignments.some(assignment => assignment.status === "ACTIVE")
          );
          setJobs(assignedJobs);
        }
      } else {
        toast.error("Failed to load jobs");
      }
    } catch (error) {
      console.error("Failed to load jobs:", error);
      toast.error("Failed to load jobs");
    }
  };


  const handleClockIn = async () => {
    if (!selectedJob) {
      toast.error("Please select a job first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/time/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clockIn",
          jobId: selectedJob,
          location: selectedLocation,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentEntry(data.data);
        setNotes("");
        toast.success("Clocked in successfully");
      } else {
        toast.error(data.error || "Failed to clock in");
      }
    } catch (error) {
      console.error("Clock in failed:", error);
      toast.error("Failed to clock in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentEntry) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/time/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clockOut",
          timeEntryId: currentEntry.id,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentEntry(null);
        setSelectedJob("");
        setNotes("");
        toast.success("Clocked out successfully");
      } else {
        toast.error(data.error || "Failed to clock out");
      }
    } catch (error) {
      console.error("Clock out failed:", error);
      toast.error("Failed to clock out");
    } finally {
      setIsLoading(false);
    }
  };

  const getClockInTime = () => {
    if (!currentEntry) return null;
    return new Date(currentEntry.clockIn).toLocaleTimeString();
  };

  const getElapsedTime = () => {
    if (!currentEntry) return "00:00:00";
    const start = new Date(currentEntry.clockIn);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const selectedJobData = jobs.find(job => job.id === selectedJob);

  return (
    <Card className={cn("w-full max-w-md mx-auto sm:max-w-lg md:max-w-xl", className)}>
      <CardHeader className="text-center p-ds-3 sm:p-ds-4">
        <CardTitle className="font-heading text-lg sm:text-xl md:text-2xl flex items-center justify-center gap-ds-2">
          <Clock className="h-5 w-5" />
          Time Clock
        </CardTitle>
        <div className="text-xl sm:text-2xl md:text-3xl font-body text-primary font-semibold">
          {currentTime}
        </div>
      </CardHeader>

      <CardContent className="space-y-ds-3 sm:space-y-ds-4 p-ds-3 sm:p-ds-4">
        {currentEntry ? (
          // Clocked In State
          <div className="space-y-ds-3">
            <div className="text-center p-ds-2 sm:p-ds-3 bg-success/10 rounded-md border">
              <Badge variant="default" className="mb-ds-2">
                Currently Clocked In
              </Badge>
              <div className="space-y-ds-1">
                <div className="text-sm text-muted-foreground">
                  Started: {getClockInTime()}
                </div>
                <div className="text-base sm:text-lg md:text-xl font-body font-semibold text-primary">
                  {getElapsedTime()}
                </div>
              </div>
            </div>

            {selectedJobData && (
              <div className="flex items-center gap-ds-2 p-ds-2 sm:p-ds-3 bg-muted rounded-md">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium text-sm sm:text-base">{selectedJobData.name}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedLocation}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-ds-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Add notes for this time entry..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              onClick={handleClockOut}
              disabled={isLoading}
              className="w-full text-sm sm:text-base py-2 sm:py-3"
              variant="destructive"
            >
              {isLoading ? "Clocking Out..." : "Clock Out"}
            </Button>
          </div>
        ) : (
          // Clock In State
          <div className="space-y-ds-4">
            <div className="space-y-ds-2">
              <Label htmlFor="job-select">Select Job</Label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger id="job-select">
                  <SelectValue placeholder="Choose a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      <div className="flex items-center gap-ds-2">
                        <span>{job.name}</span>
                        <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                          {job.location}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-ds-2">
              <Label htmlFor="location-select">Work Location</Label>
              <Select value={selectedLocation} onValueChange={(value) => setSelectedLocation(value as "FIELD" | "SHOP")}>
                <SelectTrigger id="location-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIELD">
                    <div className="flex items-center gap-ds-2">
                      <MapPin className="h-4 w-4" />
                      Field Work
                    </div>
                  </SelectItem>
                  <SelectItem value="SHOP">
                    <div className="flex items-center gap-ds-2">
                      <CalendarClock className="h-4 w-4" />
                      Shop Work
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-ds-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Add notes for this time entry..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              onClick={handleClockIn}
              disabled={isLoading || !selectedJob}
              className="w-full text-sm sm:text-base py-2 sm:py-3"
            >
              {isLoading ? "Clocking In..." : "Clock In"}
            </Button>

            {jobs.length === 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                No jobs assigned. Contact your supervisor.
              </p>
            )}
            {jobs.length > 0 && !selectedJob && (
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Please select a job to clock in
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TimeClock;