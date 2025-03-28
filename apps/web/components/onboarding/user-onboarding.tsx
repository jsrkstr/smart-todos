"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useProfile } from "@/hooks/use-profile"
import { Loader2, ChevronRight } from "lucide-react"
import { PsychProfile, OnboardingAnswers, ProfileUpdateData } from "@/types/user"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { ONBOARDING_QUESTIONS, ONBOARDING_STEPS, PRINCIPLE_SOURCES } from "./types"
import { ProgressBar } from "./components/progress-bar"
import { WelcomeStep } from "./steps/welcome-step"
import { QuestionStep } from "./steps/question-step"
import { CoachSelectionStep } from "./steps/coach-selection-step"
import { IntegrationsStep } from "./steps/integrations-step"
import { CompletedStep } from "./steps/completed-step"

// Types for questions and options
interface OnboardingOption {
  value: string;
  label: string;
}

interface OnboardingQuestion {
  id: string;
  question: string;
  options: OnboardingOption[];
}

// Main UserOnboarding Component
export function UserOnboarding(): React.ReactNode {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [selectedCoach, setSelectedCoach] = useState<string>("");
  const [customCoachName, setCustomCoachName] = useState<string>("");
  const [selectedPrinciples, setSelectedPrinciples] = useState<string[]>([]);
  const [customPrinciples, setCustomPrinciples] = useState<string[]>([]);
  const [customPrincipleInput, setCustomPrincipleInput] = useState<string>("");
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const { updateProfile } = useProfile();
  
  const currentQuestion = currentStep >= 1 && currentStep <= ONBOARDING_QUESTIONS.length 
    ? ONBOARDING_QUESTIONS[currentStep - 1] 
    : null;
  
  const handleNext = (): void => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };
  
  const handlePrevious = (): void => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleAnswerChange = (value: string): void => {
    if (currentQuestion) {
      setAnswers({
        ...answers,
        [currentQuestion.id]: value
      });
    }
  };
  
  const handleCoachSelect = (coach: string): void => {
    setSelectedCoach(coach);
  };
  
  const handlePrincipleToggle = (principle: string): void => {
    if (selectedPrinciples.includes(principle)) {
      setSelectedPrinciples(selectedPrinciples.filter(p => p !== principle));
    } else {
      setSelectedPrinciples([...selectedPrinciples, principle]);
    }
  };
  
  const handleCustomPrincipleAdd = (): void => {
    if (customPrincipleInput.trim() !== "" && !customPrinciples.includes(customPrincipleInput.trim())) {
      setCustomPrinciples([...customPrinciples, customPrincipleInput.trim()]);
      setCustomPrincipleInput("");
    }
  };
  
  const handleCustomPrincipleRemove = (principle: string): void => {
    setCustomPrinciples(customPrinciples.filter(p => p !== principle));
  };
  
  const handleIntegrationToggle = (integration: string): void => {
    if (selectedIntegrations.includes(integration)) {
      setSelectedIntegrations(selectedIntegrations.filter(i => i !== integration));
    } else {
      setSelectedIntegrations([...selectedIntegrations, integration]);
    }
  };
  
  const completeOnboarding = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Create psychological profile
      const psychProfile: PsychProfile = {
        userId: "", // Will be set by the API
        productivityTime: answers.productivityTime || "",
        communicationPref: answers.communicationPref || "",
        taskApproach: answers.taskApproach || "",
        difficultyPreference: answers.difficultyPreference || "",
        reminderTiming: answers.reminderTiming || "",
        selectedCoach: selectedCoach
      };
      
      const updateData: ProfileUpdateData = {
        preferences: answers,
        coach: selectedCoach,
        coachName: selectedCoach === "custom" ? customCoachName : undefined,
        principles: [...selectedPrinciples, ...customPrinciples],
        integrations: selectedIntegrations,
        psychProfile
      };
      
      await updateProfile(updateData);
      
      setIsComplete(true);
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoToDashboard = (): void => {
    window.location.href = "/";
  };
  
  // Show success screen after onboarding is complete
  if (isComplete) {
    return <CompletedStep onGoToDashboard={handleGoToDashboard} />;
  }
  
  // Map the current step to the appropriate component
  const renderStep = () => {
    switch (currentStep) {
      case 0: // Welcome
        return <WelcomeStep onNext={handleNext} />;
      
      case 1: // Productivity Profile
      case 2: // Communication
      case 3: // Task Approach
      case 4: // Task Timing
      case 5: // Reminder Timing
        return currentQuestion && (
          <QuestionStep
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onAnswerChange={handleAnswerChange}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      
      case 6: // Coach Selection
        return (
          <CoachSelectionStep
            selectedCoach={selectedCoach}
            customCoachName={customCoachName}
            selectedPrinciples={selectedPrinciples}
            customPrinciples={customPrinciples}
            customPrincipleInput={customPrincipleInput}
            isLoading={isLoading}
            onCoachSelect={handleCoachSelect}
            onCustomCoachNameChange={setCustomCoachName}
            onPrincipleToggle={handlePrincipleToggle}
            onCustomPrincipleInputChange={setCustomPrincipleInput}
            onCustomPrincipleAdd={handleCustomPrincipleAdd}
            onCustomPrincipleRemove={handleCustomPrincipleRemove}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      
      case 7: // Integrations
        return (
          <IntegrationsStep
            selectedIntegrations={selectedIntegrations}
            isLoading={isLoading}
            onIntegrationToggle={handleIntegrationToggle}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-8">
      <ProgressBar currentStep={currentStep} totalSteps={ONBOARDING_STEPS.length} />
      {renderStep()}
    </div>
  );
} 