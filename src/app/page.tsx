import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  MessageSquare,
  Users,
  Wrench,
  Building,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-ds-4 py-ds-6">
          <div className="text-center">
            <h1 className="font-heading text-4xl font-semibold mb-ds-2">
              Construction Field Management System
            </h1>
            <p className="text-muted-foreground font-body text-lg">
              Multi-job crew coordination and communication center
            </p>
            <Badge variant="outline" className="mt-ds-2">
              Communication & Coordination Center
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-ds-4 py-ds-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-ds-6">
          {/* Calendar Feature */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-ds-3">
                <div className="p-ds-3 bg-primary/10 rounded">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-heading">Shared Calendar</CardTitle>
                  <p className="text-sm text-muted-foreground font-body">
                    Job-specific events and scheduling
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-ds-3">
                <ul className="text-sm space-y-ds-1 font-body">
                  <li>• Job-specific event filtering</li>
                  <li>• Role-based visibility controls</li>
                  <li>• Reminder notifications</li>
                  <li>• Event creation and management</li>
                </ul>
                <Link href="/calendar">
                  <Button className="w-full">
                    Access Calendar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Messaging Feature */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-ds-3">
                <div className="p-ds-3 bg-secondary/10 rounded">
                  <MessageSquare className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="font-heading">Real-time Messaging</CardTitle>
                  <p className="text-sm text-muted-foreground font-body">
                    Job context communication
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-ds-3">
                <ul className="text-sm space-y-ds-1 font-body">
                  <li>• Job-specific message channels</li>
                  <li>• Real-time delivery</li>
                  <li>• File sharing capabilities</li>
                  <li>• Video call integration</li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Admin Panel Feature */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-ds-3">
                <div className="p-ds-3 bg-accent/10 rounded">
                  <Users className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="font-heading">Crew Management</CardTitle>
                  <p className="text-sm text-muted-foreground font-body">
                    Multi-job crew coordination
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-ds-3">
                <ul className="text-sm space-y-ds-1 font-body">
                  <li>• Crew assignment tracking</li>
                  <li>• Field/Shop location management</li>
                  <li>• Real-time progress monitoring</li>
                  <li>• Role-based access control</li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Field Operations */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-ds-3">
                <div className="p-ds-3 bg-success/10 rounded">
                  <Wrench className="h-6 w-6 text-success" />
                </div>
                <div>
                  <CardTitle className="font-heading">Field Operations</CardTitle>
                  <p className="text-sm text-muted-foreground font-body">
                    Daily operations hub
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-ds-3">
                <ul className="text-sm space-y-ds-1 font-body">
                  <li>• Blueprint markup tools</li>
                  <li>• Daily reporting forms</li>
                  <li>• Time tracking per job</li>
                  <li>• Document management</li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Job Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-ds-3">
                <div className="p-ds-3 bg-warning/10 rounded">
                  <Building className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <CardTitle className="font-heading">Project Overview</CardTitle>
                  <p className="text-sm text-muted-foreground font-body">
                    Multi-job dashboard
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-ds-3">
                <ul className="text-sm space-y-ds-1 font-body">
                  <li>• All active jobs overview</li>
                  <li>• Progress tracking</li>
                  <li>• Resource allocation</li>
                  <li>• Performance metrics</li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Health */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-ds-3">
                <div className="p-ds-3 bg-muted/10 rounded">
                  <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <CardTitle className="font-heading">System Status</CardTitle>
                  <p className="text-sm text-muted-foreground font-body">
                    API health and monitoring
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-ds-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body">Calendar API</span>
                  <Badge variant="outline" className="text-green-600">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body">Database</span>
                  <Badge variant="outline" className="text-green-600">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body">Authentication</span>
                  <Badge variant="outline" className="text-green-600">Ready</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Status */}
        <div className="mt-ds-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Implementation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-ds-4">
                <div>
                  <h4 className="font-heading font-medium mb-ds-2">Completed Features</h4>
                  <ul className="space-y-ds-1 text-sm font-body">
                    <li className="flex items-center gap-ds-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      Prisma schema with calendar, job, and messaging models
                    </li>
                    <li className="flex items-center gap-ds-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      Calendar API endpoints (CRUD operations)
                    </li>
                    <li className="flex items-center gap-ds-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      CalendarView component with job filtering
                    </li>
                    <li className="flex items-center gap-ds-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      Event creation and editing modals
                    </li>
                    <li className="flex items-center gap-ds-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      Reminder system API
                    </li>
                    <li className="flex items-center gap-ds-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      Role-based visibility controls
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-heading font-medium mb-ds-2">Technical Implementation</h4>
                  <ul className="space-y-ds-1 text-sm font-body">
                    <li className="flex items-center gap-ds-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      Next.js 14+ App Router architecture
                    </li>
                    <li className="flex items-center gap-ds-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      Prisma ORM with SQLite database
                    </li>
                    <li className="flex items-center gap-ds-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      shadcn/ui component library
                    </li>
                    <li className="flex items-center gap-ds-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      TypeScript with Zod validation
                    </li>
                    <li className="flex items-center gap-ds-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      React Hook Form with form validation
                    </li>
                    <li className="flex items-center gap-ds-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      Design system compliance
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}