import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CompletedStepProps {
  onGoToDashboard: () => void;
}

export function CompletedStep({ onGoToDashboard }: CompletedStepProps): React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to SmartTodos!</CardTitle>
        <CardDescription>
          Your profile has been set up successfully
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>You're ready to start using SmartTodos! We've customized the app based on your:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Psychological profile and work preferences</li>
          <li>Selected coaching style and motivation type</li>
          <li>Task management approach and timing preferences</li>
          <li>Communication preferences</li>
        </ul>
        <p>You can always adjust these settings later in your profile preferences.</p>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onGoToDashboard}>Go to Dashboard</Button>
      </CardFooter>
    </Card>
  );
} 