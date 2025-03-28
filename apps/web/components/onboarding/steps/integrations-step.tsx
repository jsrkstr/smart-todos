import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ChevronRight } from "lucide-react";

interface IntegrationsStepProps {
  selectedIntegrations: string[];
  isLoading: boolean;
  onIntegrationToggle: (integration: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function IntegrationsStep({
  selectedIntegrations,
  isLoading,
  onIntegrationToggle,
  onPrevious,
  onNext
}: IntegrationsStepProps): React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Your Services</CardTitle>
        <CardDescription>Connect SmartTodos with your favorite apps and services.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium">Available Integrations</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => onIntegrationToggle("google_calendar")}>
              <Checkbox 
                id="google_calendar" 
                checked={selectedIntegrations.includes("google_calendar")}
                onCheckedChange={() => onIntegrationToggle("google_calendar")}
              />
              <Label htmlFor="google_calendar" className="flex-1 cursor-pointer">Google Calendar</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => onIntegrationToggle("google_tasks")}>
              <Checkbox 
                id="google_tasks" 
                checked={selectedIntegrations.includes("google_tasks")}
                onCheckedChange={() => onIntegrationToggle("google_tasks")}
              />
              <Label htmlFor="google_tasks" className="flex-1 cursor-pointer">Google Tasks</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => onIntegrationToggle("whatsapp")}>
              <Checkbox 
                id="whatsapp" 
                checked={selectedIntegrations.includes("whatsapp")}
                onCheckedChange={() => onIntegrationToggle("whatsapp")}
              />
              <Label htmlFor="whatsapp" className="flex-1 cursor-pointer">WhatsApp</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => onIntegrationToggle("telegram")}>
              <Checkbox 
                id="telegram" 
                checked={selectedIntegrations.includes("telegram")}
                onCheckedChange={() => onIntegrationToggle("telegram")}
              />
              <Label htmlFor="telegram" className="flex-1 cursor-pointer">Telegram</Label>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            You can configure more integrations later in the settings.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          Back
        </Button>
        <Button onClick={onNext}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Complete <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 