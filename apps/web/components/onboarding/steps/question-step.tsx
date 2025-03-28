import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { OnboardingQuestion } from "../types";

interface QuestionStepProps {
  question: OnboardingQuestion;
  answer?: string;
  onAnswerChange: (value: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function QuestionStep({ 
  question, 
  answer, 
  onAnswerChange, 
  onPrevious, 
  onNext 
}: QuestionStepProps): React.ReactNode {
  // Automatically proceed to the next question when an answer is selected
  useEffect(() => {
    if (answer) {
      // Small delay to show the selection before proceeding
      const timer = setTimeout(() => {
        onNext();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [answer, onNext]);
  
  const handleOptionClick = (value: string): void => {
    // Only change the answer if it's different to avoid triggering useEffect twice
    if (value !== answer) {
      onAnswerChange(value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{question.question}</CardTitle>
        <CardDescription>
          Choose the option that best matches your preference
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {question.options.map((option) => (
            <Button
              key={option.value}
              variant={answer === option.value ? "default" : "outline"}
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => handleOptionClick(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!answer}
        >
          Continue <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
} 