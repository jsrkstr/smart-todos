import React from "react";
import { Progress } from "@/components/ui/progress";
import { ONBOARDING_STEPS } from "../types";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps): React.ReactNode {
  const progress = (currentStep / (totalSteps - 1)) * 100;
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">{ONBOARDING_STEPS[currentStep]}</h2>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
        <span>Step {currentStep + 1} of {totalSteps}</span>
        <span>{Math.round(progress)}% Complete</span>
      </div>
    </div>
  );
} 