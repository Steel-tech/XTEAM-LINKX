"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Users,
  Phone,
  MessageCircle,
  Clock,
  Wifi,
  WifiOff,
  CircleDot,
  Eye
} from "lucide-react";

interface CrewMember {
  id: string;
  name: string;
  location?: string;
  isOnline?: boolean;
  lastSeen?: string;
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
  members: CrewMember[];
  jobId: string;
  jobName: string;
  currentLocation?: string;
  lastActivity?: string;
  status: "active" | "offline" | "break";
}

interface CrewStatusProps {
  crews: CrewData[];
  onCrewSelect?: (crewId: string) => void;
  onMessageCrew?: (crewId: string) => void;
  onCallCrew?: (crewId: string) => void;
  className?: string;
  realTimeUpdates?: boolean;
}

export function CrewStatus({
  crews,
  onCrewSelect,
  onMessageCrew,
  onCallCrew,
  className,
  realTimeUpdates = false
}: CrewStatusProps) {
  const [crewStatuses, setCrewStatuses] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Simulate real-time updates (in production this would connect to WebSocket)
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      // Simulate status changes
      const newStatuses: Record<string, string> = {};
      crews.forEach(crew => {
        const statuses = ["active", "offline", "break"];
        newStatuses[crew.id] = statuses[Math.floor(Math.random() * statuses.length)];
      });
      setCrewStatuses(newStatuses);
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [crews, realTimeUpdates]);

  const getCrewStatus = (crew: CrewData) => {
    return crewStatuses[crew.id] || crew.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "offline": return "secondary";
      case "break": return "outline";
      default: return "outline";
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "active": return "text-success";
      case "offline": return "text-muted-foreground";
      case "break": return "text-warning";
      default: return "text-muted-foreground";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "FIELD" ? "bg-primary" : "bg-secondary";
  };

  const formatLastActivity = (lastActivity?: string) => {
    if (!lastActivity) return "No recent activity";
    const date = new Date(lastActivity);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getOnlineMemberCount = (members: CrewMember[]) => {
    return members.filter(member => member.isOnline).length;
  };

  if (crews.length === 0) {
    return (
      <div className="flex items-center justify-center p-ds-6 text-center">
        <div className="space-y-ds-2">
          <div className="text-muted-foreground font-body">No crews assigned</div>
          <p className="text-sm text-muted-foreground font-body">
            Assign crews to jobs to monitor their status and location.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-ds-4", className)}>
      {/* Real-time Status Header */}
      {realTimeUpdates && (
        <div className="flex items-center justify-between p-ds-3 bg-muted rounded">
          <div className="flex items-center gap-ds-2">
            <div className="flex items-center gap-ds-1">
              <CircleDot className="h-4 w-4 text-success animate-pulse" />
              <span className="font-body text-sm text-foreground">Live Updates</span>
            </div>
          </div>
          <div className="font-body text-xs text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      )}

      <div className="grid gap-ds-3 md:grid-cols-2 lg:grid-cols-3">
        {crews.map((crew) => {
          const currentStatus = getCrewStatus(crew);
          const onlineMembers = getOnlineMemberCount(crew.members);

          return (
            <Card
              key={crew.id}
              className="bg-card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onCrewSelect?.(crew.id)}
            >
              <CardHeader className="p-ds-3">
                <div className="flex items-start justify-between gap-ds-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-heading text-base text-foreground flex items-center gap-ds-2">
                      <span className="truncate">{crew.name}</span>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        getTypeColor(crew.type)
                      )} />
                    </CardTitle>
                    <p className="font-body text-sm text-muted-foreground mt-1 truncate">
                      {crew.jobName}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(currentStatus)} className="text-xs">
                    <CircleDot className={cn("h-3 w-3 mr-1", getStatusIndicator(currentStatus))} />
                    {currentStatus}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {crew.type}
                  </Badge>
                  <div className="flex items-center gap-ds-1 text-xs text-muted-foreground font-body">
                    <Users className="h-3 w-3" />
                    <span>{onlineMembers}/{crew.memberCount}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-ds-3 pt-0 space-y-ds-3">
                {/* Foreman Information */}
                {crew.foreman && (
                  <div className="space-y-ds-1">
                    <div className="font-body text-xs font-medium text-foreground">Foreman</div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm text-foreground">{crew.foreman.name}</span>
                      {crew.foreman.location && (
                        <div className="flex items-center gap-ds-1 text-xs text-muted-foreground font-body">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-20">{crew.foreman.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Current Location */}
                {crew.currentLocation && (
                  <div className="flex items-center gap-ds-1 text-sm text-muted-foreground font-body">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{crew.currentLocation}</span>
                  </div>
                )}

                {/* Crew Members Status */}
                <div className="space-y-ds-2">
                  <div className="font-body text-xs font-medium text-foreground">
                    Crew Members ({crew.memberCount})
                  </div>
                  <div className="space-y-1">
                    {crew.members.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-ds-1">
                          {member.isOnline ? (
                            <Wifi className="h-3 w-3 text-success" />
                          ) : (
                            <WifiOff className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="font-body text-foreground truncate max-w-24">
                            {member.name}
                          </span>
                        </div>
                        {member.location && (
                          <span className="font-body text-muted-foreground truncate max-w-16">
                            {member.location}
                          </span>
                        )}
                      </div>
                    ))}
                    {crew.members.length > 3 && (
                      <div className="text-xs text-muted-foreground font-body text-center">
                        +{crew.members.length - 3} more members
                      </div>
                    )}
                  </div>
                </div>

                {/* Last Activity */}
                <div className="flex items-center gap-ds-1 text-xs text-muted-foreground font-body">
                  <Clock className="h-3 w-3" />
                  <span>{formatLastActivity(crew.lastActivity)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-ds-2 pt-ds-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 font-body"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCrewSelect?.(crew.id);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-body"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMessageCrew?.(crew.id);
                    }}
                  >
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-body"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCallCrew?.(crew.id);
                    }}
                  >
                    <Phone className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}