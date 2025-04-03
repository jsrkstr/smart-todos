"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layouts/page-header";
import { Separator } from "@/components/ui/separator";
import { CoachSelection } from "@/components/coach/coach-selection";
import { useCoaches } from "@/hooks/use-coaches";
import { useProfile } from "@/hooks/use-profile";
import { useToast } from "@/hooks/use-toast"
import { AppLayout } from "@/components/layouts/app-layout";

export default function MyCoachPage() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const [selectedCoachId, setSelectedCoachId] = useState<string | undefined>();
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    setSelectedCoachId(profile?.psychProfile?.coachId);
  }, [profile]);

  const handleCoachSelect = async (coachId: string) => {
    if (coachId === selectedCoachId) return;
    
    setUpdating(true);
    try {
      await updateProfile({
        psychProfile: {
          coachId: coachId
        }
      });
      setSelectedCoachId(coachId);
      toast({
        title: "Coach updated",
        description: "Your motivational coach has been updated successfully",
      });
    } catch (error) {
      console.error("Failed to update coach:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your coach. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="container max-w-3xl mx-auto py-6">
          <CoachSelection 
            title={profile?.psychProfile?.coach ? "My Motivational Coach" : "Choose Your Motivational Coach"}
            description={
              profile?.psychProfile?.coach 
                ? `You're currently working with ${profile?.psychProfile?.coach.name}. You can change your coach at any time.` 
                : "Select a coach to motivate and guide you through your tasks."
            }
            selectedCoachId={selectedCoachId}
            onComplete={handleCoachSelect}
          />
        </div>
      </div>
    </AppLayout>
  );
} 