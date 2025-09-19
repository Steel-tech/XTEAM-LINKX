"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowLeft, Shield } from "lucide-react";

export default function UnauthorizedPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-ds-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-ds-3">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="font-heading text-xl text-foreground flex items-center justify-center gap-ds-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-ds-4 text-center">
          <div className="space-y-ds-2">
            <p className="font-body text-muted-foreground">
              You don&apos;t have permission to access this page.
            </p>
            {session?.user && (
              <div className="space-y-ds-2">
                <p className="font-body text-sm text-foreground">
                  Signed in as: <span className="font-medium">{session.user.email}</span>
                </p>
                <div className="flex items-center justify-center gap-ds-2">
                  <span className="font-body text-sm text-muted-foreground">Current role:</span>
                  <Badge variant="outline" className="text-xs">
                    {session.user.role || "FIELD"}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <div className="bg-muted p-ds-3 rounded text-left">
            <h3 className="font-heading text-sm font-medium text-foreground mb-ds-2">
              Required Access Level:
            </h3>
            <ul className="space-y-ds-1 text-sm text-muted-foreground font-body">
              <li>• Admin Dashboard: <Badge variant="outline" className="text-xs ml-1">ADMIN</Badge> or <Badge variant="outline" className="text-xs ml-1">PM</Badge></li>
              <li>• Job Management: <Badge variant="outline" className="text-xs ml-1">FOREMAN</Badge> or higher</li>
              <li>• Field Operations: <Badge variant="outline" className="text-xs ml-1">FIELD</Badge> or <Badge variant="outline" className="text-xs ml-1">SHOP</Badge></li>
            </ul>
          </div>

          <div className="space-y-ds-2">
            <p className="font-body text-sm text-muted-foreground">
              Contact your administrator to request access to this feature.
            </p>
            <div className="flex gap-ds-2">
              <Button
                variant="outline"
                className="flex-1 font-body"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-ds-1" />
                Go Back
              </Button>
              <Button
                className="flex-1 font-body"
                onClick={() => window.location.href = "/"}
              >
                Go Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}