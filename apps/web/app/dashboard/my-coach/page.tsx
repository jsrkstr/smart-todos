"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layouts/page-header";
import { Separator } from "@/components/ui/separator";
import { CoachSelection } from "@/components/coach/coach-selection";
import { useCoaches } from "@/hooks/use-coaches";
import { useProfile } from "@/hooks/use-profile";

export default function MyCoachPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        heading="My Coach"
        description="View and customize your motivational coach"
      />

      <Separator />

      <div className="container max-w-3xl mx-auto py-6">
        <CoachSelection 
          title={profile?.psychProfile?.coach ? "My Motivational Coach" : "Choose Your Motivational Coach"}
          description={
            profile?.psychProfile?.coach 
              ? `You're currently working with ${profile?.psychProfile?.coach.name}. You can change your coach at any time.` 
              : "Select a coach to motivate and guide you through your tasks."
          }
          onComplete={(coachId: string) => { setSelectedCoachId(coachId)}}
        />
      </div>
    </div>
  );
} 