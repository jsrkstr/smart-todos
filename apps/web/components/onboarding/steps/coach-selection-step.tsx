import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { CoachSelection } from "@/components/coach/coach-selection";

interface CoachSelectionProps {
  selectedCoach: string;
  customCoachName: string;
  selectedPrinciples: string[];
  customPrinciples: string[];
  customPrincipleInput: string;
  isLoading: boolean;
  onCoachSelect: (coach: string) => void;
  onCustomCoachNameChange: (name: string) => void;
  onPrincipleToggle: (principle: string) => void;
  onCustomPrincipleInputChange: (input: string) => void;
  onCustomPrincipleAdd: () => void;
  onCustomPrincipleRemove: (principle: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function CoachSelectionStep({
  selectedCoach,
  isLoading,
  onCoachSelect,
  onPrevious,
  onNext
}: CoachSelectionProps): React.ReactNode {
  // Handle coach selection within the onboarding flow
  const handleCoachSelection = (coachId: string) => {
    // The coach selection is handled by the CoachSelection component
    // which updates in the database. This function is called when selection is complete.
    onCoachSelect(coachId);
    onNext();
  };

  return (
    <div className="space-y-4">
      <CoachSelection 
        onComplete={handleCoachSelection}
        title="Choose Your Motivational Coach" 
        description="Your coach will motivate you and help you complete tasks based on your personality profile."
      />
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onNext}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Finish
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 