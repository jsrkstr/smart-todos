import { Coach } from "@prisma/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface UseCoachSelectionProps {
  coaches: Coach[];
  coachId?: string | null;
  onCoachSelect: (coachId: string) => Promise<void>;
}

export function useCoachSelection({ 
  coaches, 
  coachId, 
  onCoachSelect 
}: UseCoachSelectionProps) {
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  // Update current coach when coaches list or coachId changes
  useEffect(() => {
    if (!coachId) {
      setCurrentCoach(null);
      return;
    }

    const found = coaches.find(coach => coach.id === coachId);
    setCurrentCoach(found || null);
  }, [coaches, coachId]);

  const selectCoach = async (coachId: string) => {
    setSelectionLoading(true);
    setSelectionError(null);
    try {
      await onCoachSelect(coachId);
      const selectedCoach = coaches.find(coach => coach.id === coachId);
      if (selectedCoach) {
        setCurrentCoach(selectedCoach);
        toast.success("Coach selected successfully");
      }
      return selectedCoach || null;
    } catch (err) {
      console.error("Error selecting coach:", err);
      setSelectionError("Failed to select coach");
      toast.error("Failed to select coach");
      return null;
    } finally {
      setSelectionLoading(false);
    }
  };

  return {
    currentCoach,
    selectionLoading,
    selectionError,
    selectCoach,
  };
} 