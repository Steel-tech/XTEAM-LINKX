"use client";

import { TimeClock } from "@/components/TimeClock";

export default function TimeClockPage() {
  return (
    <div className="min-h-screen bg-background p-ds-4">
      <div className="container mx-auto max-w-lg">
        <h1 className="font-heading text-3xl font-semibold text-center mb-ds-6">
          Time Clock System
        </h1>
        <TimeClock />
      </div>
    </div>
  );
}