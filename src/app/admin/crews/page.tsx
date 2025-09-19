import { Metadata } from "next";
import CrewManager from "@/components/CrewManager";

export const metadata: Metadata = {
  title: "Crew Management | Field Operations",
  description: "Manage crew assignments, track performance, and coordinate workforce across jobs",
};

export default function CrewManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-ds-6">
        <CrewManager />
      </div>
    </div>
  );
}