"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { BlueprintViewer } from "@/components/BlueprintViewer";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  FileImage,
  Clock,
  User,
  Share,
  Download,
  Plus,
  FolderOpen,
} from "lucide-react";

interface Blueprint {
  id: string;
  name: string;
  description?: string;
  fileUrl: string;
  mimeType?: string;
  markups: string;
  job: {
    id: string;
    name: string;
    location: string;
    status: string;
  };
  markupSaves: BlueprintMarkup[];
  createdAt: string;
  updatedAt: string;
}

interface BlueprintMarkup {
  id: string;
  name: string;
  markupData: string;
  description?: string;
  isShared: boolean;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function BlueprintsPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
  const [currentMarkup, setCurrentMarkup] = useState<string>("[]");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSavedMarkups, setShowSavedMarkups] = useState(false);
  const [selectedMarkupSave, setSelectedMarkupSave] = useState<BlueprintMarkup | null>(null);

  // Load blueprints for the job
  useEffect(() => {
    loadBlueprints();
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBlueprints = async () => {
    try {
      setLoading(true);

      // For demo purposes, we'll create some sample blueprints
      // In a real app, this would fetch from /api/jobs/[id]/blueprints
      const mockBlueprints: Blueprint[] = [
        {
          id: "blueprint-1",
          name: "Floor Plan - Level 1",
          description: "Main floor construction blueprint",
          fileUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop",
          mimeType: "image/jpeg",
          markups: "[]",
          job: {
            id: jobId,
            name: "Construction Site A",
            location: "FIELD",
            status: "ACTIVE",
          },
          markupSaves: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "blueprint-2",
          name: "Electrical Layout",
          description: "Electrical systems and wiring plan",
          fileUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop",
          mimeType: "image/jpeg",
          markups: "[]",
          job: {
            id: jobId,
            name: "Construction Site A",
            location: "FIELD",
            status: "ACTIVE",
          },
          markupSaves: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      setBlueprints(mockBlueprints);
      if (mockBlueprints.length > 0) {
        const firstBlueprint = mockBlueprints[0];
        if (firstBlueprint) {
          setSelectedBlueprint(firstBlueprint);
          setCurrentMarkup(firstBlueprint.markups || "[]");
        }
      }
    } catch (err) {
      setError("Failed to load blueprints");
      console.error("Error loading blueprints:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadBlueprintDetails = async (blueprintId: string) => {
    try {
      const response = await fetch(`/api/blueprints/${blueprintId}`);
      const result = await response.json();

      if (result.success) {
        const blueprint = result.data;
        setSelectedBlueprint(blueprint);
        setCurrentMarkup(blueprint.markups);
      } else {
        setError(result.error || "Failed to load blueprint");
      }
    } catch (err) {
      setError("Failed to load blueprint details");
      console.error("Error loading blueprint:", err);
    }
  };

  const saveMarkup = async (markupData: string, name?: string) => {
    if (!selectedBlueprint) return;

    try {
      // Save as new markup save if name provided
      if (name) {
        const response = await fetch(`/api/blueprints/${selectedBlueprint.id}/markup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            markupData,
            description: `Markup saved on ${new Date().toLocaleString()}`,
            isShared: false,
          }),
        });

        const result = await response.json();
        if (result.success) {
          // Reload blueprint to get updated markup saves
          await loadBlueprintDetails(selectedBlueprint.id);
        } else {
          setError(result.error || "Failed to save markup");
        }
      } else {
        // Update main blueprint markup
        const response = await fetch(`/api/blueprints/${selectedBlueprint.id}/markup`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markupData }),
        });

        const result = await response.json();
        if (result.success) {
          setCurrentMarkup(markupData);
        } else {
          setError(result.error || "Failed to update markup");
        }
      }
    } catch (err) {
      setError("Failed to save markup");
      console.error("Error saving markup:", err);
    }
  };

  const loadSavedMarkup = (markupSave: BlueprintMarkup) => {
    setCurrentMarkup(markupSave.markupData);
    setSelectedMarkupSave(markupSave);
    setShowSavedMarkups(false);
  };

  const shareBlueprint = async () => {
    if (!selectedBlueprint) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Blueprint: ${selectedBlueprint.name}`,
          text: `View blueprint for ${selectedBlueprint.job.name}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Blueprint link copied to clipboard");
      }
    } catch (err) {
      console.error("Error sharing blueprint:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-ds-2">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="font-body text-muted-foreground">Loading blueprints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-ds-4 text-center">
            <p className="text-destructive font-body mb-ds-4">{error}</p>
            <Button onClick={loadBlueprints}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center justify-between p-ds-2">
          <div className="flex items-center gap-ds-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-heading text-lg font-semibold">Blueprints</h1>
              {selectedBlueprint && (
                <p className="font-body text-sm text-muted-foreground">
                  {selectedBlueprint.job.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-ds-1">
            {selectedBlueprint && (
              <>
                <Dialog open={showSavedMarkups} onOpenChange={setShowSavedMarkups}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="touch-manipulation">
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Saved Markups</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-ds-2 max-h-60 overflow-y-auto">
                      {selectedBlueprint.markupSaves.length === 0 ? (
                        <p className="text-center text-muted-foreground font-body py-ds-4">
                          No saved markups
                        </p>
                      ) : (
                        selectedBlueprint.markupSaves.map((markup) => (
                          <Card
                            key={markup.id}
                            className="cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => loadSavedMarkup(markup)}
                          >
                            <CardContent className="p-ds-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-body font-medium text-sm">
                                    {markup.name}
                                  </h4>
                                  <div className="flex items-center gap-ds-2 mt-ds-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-ds-1">
                                      <User className="h-3 w-3" />
                                      {markup.user?.name || markup.user?.email || "Unknown"}
                                    </div>
                                    <div className="flex items-center gap-ds-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(markup.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={shareBlueprint}
                  className="touch-manipulation"
                >
                  <Share className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Blueprint Selector - Mobile Friendly */}
        {blueprints.length > 1 && (
          <div className="px-ds-2 pb-ds-2">
            <Select
              value={selectedBlueprint?.id || ""}
              onValueChange={(blueprintId) => {
                const blueprint = blueprints.find(b => b.id === blueprintId);
                if (blueprint) {
                  setSelectedBlueprint(blueprint);
                  setCurrentMarkup(blueprint.markups);
                  setSelectedMarkupSave(null);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select blueprint" />
              </SelectTrigger>
              <SelectContent>
                {blueprints.map((blueprint) => (
                  <SelectItem key={blueprint.id} value={blueprint.id}>
                    <div className="flex items-center gap-ds-2">
                      <FileImage className="h-4 w-4" />
                      {blueprint.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Blueprint Viewer */}
      {selectedBlueprint ? (
        <div className="relative">
          {selectedMarkupSave && (
            <div className="absolute top-ds-2 left-ds-2 right-ds-2 z-20">
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-ds-2 text-center">
                  <p className="font-body text-sm">
                    Viewing saved markup: {selectedMarkupSave.name}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setCurrentMarkup(selectedBlueprint.markups);
                      setSelectedMarkupSave(null);
                    }}
                    className="mt-ds-1"
                  >
                    Back to current
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-120px)]">
            <BlueprintViewer
              blueprintUrl={selectedBlueprint.fileUrl}
              initialMarkups={currentMarkup}
              onSaveMarkup={(markupData) => saveMarkup(markupData)}
              className="w-full h-full"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[calc(100vh-140px)] md:h-[calc(100vh-120px)]">
          <Card className="max-w-sm mx-auto">
            <CardContent className="pt-ds-4 text-center">
              <FileImage className="h-12 w-12 mx-auto mb-ds-4 text-muted-foreground" />
              <h3 className="font-heading text-lg mb-ds-2">No Blueprints</h3>
              <p className="font-body text-muted-foreground">
                No blueprints found for this job.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}