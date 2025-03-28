"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layouts/page-header";
import { Separator } from "@/components/ui/separator";
import { CoachSelection } from "@/components/coach/coach-selection";
import { useCoaches } from "@/hooks/use-coaches";

export default function MyCoachPage() {
  const router = useRouter();
  const { currentCoach } = useCoaches();

  return (
    <div className="space-y-6">
      <PageHeader
        heading="My Coach"
        description="View and customize your motivational coach"
      />

      <Separator />

      <div className="container max-w-3xl mx-auto py-6">
        <CoachSelection 
          title={currentCoach ? "My Motivational Coach" : "Choose Your Motivational Coach"}
          description={
            currentCoach 
              ? `You're currently working with ${currentCoach.name}. You can change your coach at any time.` 
              : "Select a coach to motivate and guide you through your tasks."
          }
        />
      </div>
    </div>
  );
} 