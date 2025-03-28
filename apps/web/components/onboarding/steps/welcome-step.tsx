import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps): React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to SmartTodos</CardTitle>
        <CardDescription>
          Let's set up your personalized experience to help you complete tasks effectively.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="hidden md:block">
          During this onboarding process, we'll ask you some questions to understand your preferences, work habits,
          and psychological profile. This will help us tailor the app to your unique needs.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col items-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="h-8 w-8 mb-2 text-yellow-500">🌞</div>
            <h3 className="font-medium">Personalized Experience</h3>
            <p className="text-sm text-center text-muted-foreground">Tailored to your unique work style</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="h-8 w-8 mb-2 text-blue-500">🌙</div>
            <h3 className="font-medium">Psychological Profile</h3>
            <p className="text-sm text-center text-muted-foreground">Adaptive to your behavioral patterns</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="h-8 w-8 mb-2 text-amber-500">⚡</div>
            <h3 className="font-medium">Motivational Coaching</h3>
            <p className="text-sm text-center text-muted-foreground">Customized encouragement and support</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div></div>
        <Button onClick={onNext}>
          Continue <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
} 