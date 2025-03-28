import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight, ChevronLeft, MessageSquare } from "lucide-react";
import { PRINCIPLE_SOURCES } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Sample coaches based on new design
const coaches = [
  {
    id: "1",
    name: "Steve",
    title: "The Innovator",
    image: "/placeholder.svg?height=100&width=100",
    description: "Pushes you to think differently and challenges conventional approaches.",
    style: "Challenging",
    matchScore: 87,
    sampleQuote: "Stay hungry. Stay foolish. Push beyond what you think is possible.",
  },
  {
    id: "2",
    name: "Marie",
    title: "The Scientist",
    image: "/placeholder.svg?height=100&width=100",
    description: "Methodical and process-oriented approach with analytical feedback.",
    style: "Analytical",
    matchScore: 92,
    sampleQuote: "Break down each problem into its smallest components for clarity.",
  },
  {
    id: "3",
    name: "Marcus",
    title: "The Philosopher",
    image: "/placeholder.svg?height=100&width=100",
    description: "Focuses on mindfulness and purpose in your daily tasks.",
    style: "Reflective",
    matchScore: 81,
    sampleQuote: "The obstacle is the way. What stands in the way becomes the way.",
  },
  {
    id: "4",
    name: "Grace",
    title: "The Engineer",
    image: "/placeholder.svg?height=100&width=100",
    description: "Structured and systematic approach to problem-solving.",
    style: "Structured",
    matchScore: 78,
    sampleQuote: "Always have a plan, but be ready to debug and iterate when needed.",
  },
  {
    id: "5",
    name: "Alex",
    title: "The Olympian",
    image: "/placeholder.svg?height=100&width=100",
    description: "High-energy motivator focused on personal bests and incremental gains.",
    style: "Motivational",
    matchScore: 89,
    sampleQuote: "Progress happens when you push just slightly beyond your comfort zone.",
  },
];

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
  const [activeTab, setActiveTab] = React.useState<string>("featured");
  const [previewCoach, setPreviewCoach] = React.useState<string | null>(null);
  const [customCoachSettings, setCustomCoachSettings] = React.useState({
    directness: 50,
    style: "balanced",
    encouragement: 70,
  });

  const handleCoachSelect = (id: string) => {
    onCoachSelect(id);
  };

  const handleCustomCoachCreate = () => {
    if (customCoachName) {
      onCoachSelect("custom");
      setActiveTab("featured");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Motivational Coach</CardTitle>
        <CardDescription>
          Your coach will provide personalized guidance and motivation based on your work style.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="featured" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="featured">Featured Coaches</TabsTrigger>
            <TabsTrigger value="custom">Create Custom Coach</TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {coaches.map((coach) => (
                <div
                  key={coach.id}
                  className={`rounded-lg border p-4 cursor-pointer transition-all ${
                    selectedCoach === coach.id ? "border-primary ring-2 ring-primary" : "hover:border-primary/50"
                  }`}
                  onClick={() => handleCoachSelect(coach.id)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      <Image src={coach.image} alt={coach.name} width={48} height={48} className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-medium">{coach.name}</h3>
                      <p className="text-xs text-muted-foreground">{coach.title}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="mb-2">
                    {coach.style}
                  </Badge>
                  <p className="text-sm text-muted-foreground mb-3">{coach.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="font-medium text-primary">{coach.matchScore}%</span> match
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewCoach(coach.id);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{coach.name} - Coaching Preview</DialogTitle>
                          <DialogDescription>
                            Here's how {coach.name} would coach you based on your profile.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 my-4">
                          <div className="flex items-start gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-1">
                              <Image
                                src={coach.image}
                                alt={coach.name}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            </div>
                            <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                              <p className="text-sm">{coach.sampleQuote}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-1">
                              <Image
                                src={coach.image}
                                alt={coach.name}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            </div>
                            <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                              <p className="text-sm">
                                I see you're struggling with this task. Let's break it down into smaller components and
                                tackle them one by one.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-1">
                              <Image
                                src={coach.image}
                                alt={coach.name}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            </div>
                            <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                              <p className="text-sm">
                                You've been making great progress! You've completed 7 tasks today, which is 30% more
                                than your average.
                              </p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="pt-4">
            <div className="space-y-6">
              <div>
                <Label htmlFor="custom-coach-name">Coach Name</Label>
                <Input
                  id="custom-coach-name"
                  placeholder="Enter a name for your coach"
                  value={customCoachName}
                  onChange={(e) => onCustomCoachNameChange(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium">Communication Directness</h3>
                <Slider
                  value={[customCoachSettings.directness]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => setCustomCoachSettings({ ...customCoachSettings, directness: value[0] })}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Gentle & Supportive</span>
                  <span>Direct & Challenging</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Coaching Style</h3>
                <RadioGroup
                  value={customCoachSettings.style}
                  onValueChange={(value) => setCustomCoachSettings({ ...customCoachSettings, style: value })}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="analytical" id="analytical" />
                    <Label htmlFor="analytical">Analytical - Fact-based with data-driven insights</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="motivational" id="motivational" />
                    <Label htmlFor="motivational">Motivational - Focused on encouragement and positive feedback</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="balanced" id="balanced" />
                    <Label htmlFor="balanced">Balanced - Mix of analytical insights and motivation</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Encouragement Level</h3>
                <Slider
                  value={[customCoachSettings.encouragement]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => setCustomCoachSettings({ ...customCoachSettings, encouragement: value[0] })}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Minimal</span>
                  <span>Frequent</span>
                </div>
              </div>

              <Button
                onClick={handleCustomCoachCreate}
                disabled={!customCoachName}
                className="w-full mt-4"
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
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
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
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 