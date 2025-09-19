"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReportForm from "@/components/ReportForm";
import {
  Plus,
  FileText,
  AlertTriangle,
  Shield,
  Calendar,
  User,
  ChevronRight,
  Filter,
  Download,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Report {
  id: string;
  title: string;
  type: "INSPECTION" | "NCR" | "SAFETY" | "PROGRESS" | "INCIDENT";
  status: "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED";
  createdAt: string;
  submittedAt?: string;
  content: Record<string, any>;
  attachments: string[];
  user: {
    id: string;
    name: string;
    email: string;
  };
  job: {
    id: string;
    name: string;
    location: string;
  };
}

interface Job {
  id: string;
  name: string;
  location: string;
  description?: string;
  status: string;
}

export default function JobReportsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [job, setJob] = useState<Job | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState({
    type: "ALL",
    status: "ALL",
    dateRange: "ALL"
  });

  const jobId = params.id as string;

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  // Fetch job details and reports
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id || !jobId) return;

      try {
        setIsLoading(true);

        // Fetch job details (you'll need to create this endpoint)
        const jobResponse = await fetch(`/api/jobs/${jobId}`, {
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          setJob(jobData.data);
        }

        // Fetch reports for this job
        const reportsResponse = await fetch(`/api/reports?jobId=${jobId}`, {
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          setReports(reportsData.data.reports);
          setFilteredReports(reportsData.data.reports);
        } else {
          console.error("Failed to fetch reports");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session, jobId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...reports];

    if (filters.type !== "ALL") {
      filtered = filtered.filter(report => report.type === filters.type);
    }

    if (filters.status !== "ALL") {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    if (filters.dateRange !== "ALL") {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case "TODAY":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "WEEK":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "MONTH":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      if (filters.dateRange !== "ALL") {
        filtered = filtered.filter(report =>
          new Date(report.createdAt) >= filterDate
        );
      }
    }

    setFilteredReports(filtered);
  }, [reports, filters]);

  const handleCreateReport = async (reportData: any) => {
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...reportData,
          jobId
        })
      });

      if (response.ok) {
        const newReport = await response.json();
        setReports(prev => [newReport.data, ...prev]);
        setIsCreateDialogOpen(false);

        // Show success message
        alert(`Report ${reportData.status === "SUBMITTED" ? "submitted" : "saved"} successfully!`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create report");
      }
    } catch (error) {
      console.error("Error creating report:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Failed to create report"}`);
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "INSPECTION": return <FileText className="w-4 h-4" />;
      case "NCR": return <AlertTriangle className="w-4 h-4" />;
      case "SAFETY": return <Shield className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-muted text-muted-foreground";
      case "SUBMITTED": return "bg-primary text-primary-foreground";
      case "REVIEWED": return "bg-warning text-warning-foreground";
      case "APPROVED": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "INSPECTION": return "bg-primary/10 text-primary border-primary/20";
      case "NCR": return "bg-destructive/10 text-destructive border-destructive/20";
      case "SAFETY": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse font-body">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Daily Reports</h1>
          {job && (
            <p className="font-body text-muted-foreground">
              {job.name} • {job.location}
            </p>
          )}
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 font-body">
              <Plus className="w-4 h-4" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Create New Report</DialogTitle>
            </DialogHeader>
            <ReportForm
              jobId={jobId}
              onSubmit={handleCreateReport}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="font-body text-sm text-muted-foreground">Filters:</span>
            </div>

            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="w-32 font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="INSPECTION">Inspection</SelectItem>
                <SelectItem value="NCR">NCR</SelectItem>
                <SelectItem value="SAFETY">Safety</SelectItem>
                <SelectItem value="PROGRESS">Progress</SelectItem>
                <SelectItem value="INCIDENT">Incident</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-32 font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
              <SelectTrigger className="w-32 font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Time</SelectItem>
                <SelectItem value="TODAY">Today</SelectItem>
                <SelectItem value="WEEK">This Week</SelectItem>
                <SelectItem value="MONTH">This Month</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2 text-sm font-body text-muted-foreground">
              Showing {filteredReports.length} of {reports.length} reports
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-lg mb-2">No reports found</h3>
              <p className="font-body text-muted-foreground mb-4">
                {reports.length === 0
                  ? "Get started by creating your first report"
                  : "Try adjusting your filters to see more reports"
                }
              </p>
              {reports.length === 0 && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="font-body"
                >
                  Create First Report
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex items-center gap-2 px-2 py-1 rounded-md border text-xs font-body", getTypeColor(report.type))}>
                        {getReportTypeIcon(report.type)}
                        {report.type}
                      </div>
                      <Badge className={cn("text-xs font-body", getStatusColor(report.status))}>
                        {report.status}
                      </Badge>
                    </div>

                    <h3 className="font-heading text-lg font-semibold">{report.title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-body">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {report.user.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                      {report.submittedAt && (
                        <div className="text-xs text-primary">
                          Submitted {format(new Date(report.submittedAt), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                      className="font-body"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Report Details Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {selectedReport?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className={cn("flex items-center gap-2 px-3 py-1 rounded-md border font-body text-sm", getTypeColor(selectedReport.type))}>
                  {getReportTypeIcon(selectedReport.type)}
                  {selectedReport.type}
                </div>
                <Badge className={cn("font-body", getStatusColor(selectedReport.status))}>
                  {selectedReport.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-heading text-muted-foreground">Created by:</span>
                  <p className="font-body">{selectedReport.user.name}</p>
                </div>
                <div>
                  <span className="font-heading text-muted-foreground">Created:</span>
                  <p className="font-body">{format(new Date(selectedReport.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
                {selectedReport.submittedAt && (
                  <div>
                    <span className="font-heading text-muted-foreground">Submitted:</span>
                    <p className="font-body">{format(new Date(selectedReport.submittedAt), "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-heading text-lg mb-3">Report Content</h4>
                <div className="bg-muted/50 rounded-lg p-4">
                  <pre className="font-body text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedReport.content, null, 2)}
                  </pre>
                </div>
              </div>

              {selectedReport.attachments.length > 0 && (
                <div>
                  <h4 className="font-heading text-lg mb-3">Attachments</h4>
                  <div className="space-y-2">
                    {selectedReport.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm font-body">
                        <FileText className="w-4 h-4" />
                        {attachment}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}