import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ChevronRight } from "lucide-react";
import { PRINCIPLE_SOURCES } from "../types";

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
  customCoachName,
  selectedPrinciples,
  customPrinciples,
  customPrincipleInput,
  isLoading,
  onCoachSelect,
  onCustomCoachNameChange,
  onPrincipleToggle,
  onCustomPrincipleInputChange,
  onCustomPrincipleAdd,
  onCustomPrincipleRemove,
  onPrevious,
  onNext
}: CoachSelectionProps): React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose your coach</CardTitle>
        <CardDescription>
          Select a coach whose principles will guide your task management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="featured">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="featured">Featured Coaches</TabsTrigger>
            <TabsTrigger value="custom">Create Custom Coach</TabsTrigger>
          </TabsList>
          
          <TabsContent value="featured" className="space-y-4">
            <Select value={selectedCoach} onValueChange={onCoachSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a coach" />
              </SelectTrigger>
              <SelectContent>
                {PRINCIPLE_SOURCES.map((source) => (
                  <SelectItem key={source.id} value={source.id || ""}>
                    {source.name} - {source.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedCoach && selectedCoach !== "custom" && (
              <div className="space-y-4">
                <h4 className="font-medium">Select principles you'd like to follow:</h4>
                <div className="space-y-3">
                  {PRINCIPLE_SOURCES.find(source => source.id === selectedCoach)?.name === "Steve Jobs" && (
                    <>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="focus" 
                          checked={selectedPrinciples.includes("focus")}
                          onCheckedChange={() => onPrincipleToggle("focus")}
                        />
                        <Label htmlFor="focus">Focus on what truly matters</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="simplicity" 
                          checked={selectedPrinciples.includes("simplicity")}
                          onCheckedChange={() => onPrincipleToggle("simplicity")}
                        />
                        <Label htmlFor="simplicity">Embrace simplicity</Label>
                      </div>
                    </>
                  )}
                  
                  {PRINCIPLE_SOURCES.find(source => source.id === selectedCoach)?.name === "Elon Musk" && (
                    <>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="first_principles" 
                          checked={selectedPrinciples.includes("first_principles")}
                          onCheckedChange={() => onPrincipleToggle("first_principles")}
                        />
                        <Label htmlFor="first_principles">First principles thinking</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="ambitious_goals" 
                          checked={selectedPrinciples.includes("ambitious_goals")}
                          onCheckedChange={() => onPrincipleToggle("ambitious_goals")}
                        />
                        <Label htmlFor="ambitious_goals">Set ambitious goals</Label>
                      </div>
                    </>
                  )}
                  
                  {PRINCIPLE_SOURCES.find(source => source.id === selectedCoach)?.name === "Marie Kondo" && (
                    <>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="joy" 
                          checked={selectedPrinciples.includes("joy")}
                          onCheckedChange={() => onPrincipleToggle("joy")}
                        />
                        <Label htmlFor="joy">Choose tasks that spark joy</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="declutter" 
                          checked={selectedPrinciples.includes("declutter")}
                          onCheckedChange={() => onPrincipleToggle("declutter")}
                        />
                        <Label htmlFor="declutter">Declutter your task list</Label>
                      </div>
                    </>
                  )}
                  
                  {PRINCIPLE_SOURCES.find(source => source.id === selectedCoach)?.name === "Naval Ravikant" && (
                    <>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="leverage" 
                          checked={selectedPrinciples.includes("leverage")}
                          onCheckedChange={() => onPrincipleToggle("leverage")}
                        />
                        <Label htmlFor="leverage">Seek leverage in your tasks</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="specific_knowledge" 
                          checked={selectedPrinciples.includes("specific_knowledge")}
                          onCheckedChange={() => onPrincipleToggle("specific_knowledge")}
                        />
                        <Label htmlFor="specific_knowledge">Develop specific knowledge</Label>
                      </div>
                    </>
                  )}
                  
                  {PRINCIPLE_SOURCES.find(source => source.id === selectedCoach)?.name === "David Allen (GTD)" && (
                    <>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="capture" 
                          checked={selectedPrinciples.includes("capture")}
                          onCheckedChange={() => onPrincipleToggle("capture")}
                        />
                        <Label htmlFor="capture">Capture everything</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="next_action" 
                          checked={selectedPrinciples.includes("next_action")}
                          onCheckedChange={() => onPrincipleToggle("next_action")}
                        />
                        <Label htmlFor="next_action">Define next actions</Label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-coach-name">Custom Coach Name</Label>
                <Input
                  id="custom-coach-name"
                  placeholder="Enter coach name"
                  value={customCoachName}
                  onChange={(e) => onCustomCoachNameChange(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Coach Principles</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a principle"
                    value={customPrincipleInput}
                    onChange={(e) => onCustomPrincipleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onCustomPrincipleAdd();
                      }
                    }}
                  />
                  <Button type="button" onClick={onCustomPrincipleAdd}>Add</Button>
                </div>
                
                {customPrinciples.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {customPrinciples.map((principle, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted">
                        <span>{principle}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onCustomPrincipleRemove(principle)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button 
                type="button" 
                className="mt-2 w-full"
                onClick={() => {
                  onCoachSelect("custom");
                }}
                disabled={!customCoachName}
              >
                Create Custom Coach
              </Button>
            </div>
          </TabsContent>
        </Tabs>
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
          disabled={!selectedCoach}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 