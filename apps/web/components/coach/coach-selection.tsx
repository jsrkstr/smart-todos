"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Loader2 } from "lucide-react";
import { useCoaches } from "@/hooks/use-coaches";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useProfile } from "@/hooks/use-profile";

interface CoachSelectionProps {
  onComplete?: (coachId: string) => void;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  description?: string;
}

export function CoachSelection({
  onComplete,
  showBackButton = false,
  onBack,
  title = "Choose Your Motivational Coach",
  description = "Your coach will provide personalized guidance and motivation based on your work style."
}: CoachSelectionProps) {
  const {
    coaches,
    loading,
    createCustomCoach,
  } = useCoaches();

  const { profile } = useProfile();
  
  const [activeTab, setActiveTab] = useState<string>("featured");
  const [previewCoach, setPreviewCoach] = useState<string | null>(null);
  const [customCoachName, setCustomCoachName] = useState<string>("");
  const [customCoachSettings, setCustomCoachSettings] = useState({
    directness: 50,
    style: "balanced",
    encouragement: 70,
  });
  const [saving, setSaving] = useState(false);

  const handleCoachSelect = async (id: string) => {
    if (profile?.psychProfile?.coachId === id) return;
    if (onComplete) onComplete(id);
  };

  const handleCustomCoachCreate = async () => {
    if (!customCoachName) return;
    
    setSaving(true);
    try {
      const newCoach = await createCustomCoach({
        name: customCoachName,
        title: "Custom Coach",
        description: "Your personalized coach with custom settings",
        style: customCoachSettings.style === "analytical" ? "Analytical" : 
               customCoachSettings.style === "motivational" ? "Motivational" : 
               customCoachSettings.style === "reflective" ? "Reflective" : "Balanced",
        directness: customCoachSettings.directness,
        encouragementLevel: customCoachSettings.encouragement,
        coachingStyle: customCoachSettings.style,
      });
      
      if (newCoach) {
        setActiveTab("featured");
        setCustomCoachName("");
        if (onComplete) onComplete(newCoach.id);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="featured" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="featured">Featured Coaches</TabsTrigger>
            <TabsTrigger value="custom">Create Custom Coach</TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="pt-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {coaches.filter(c => c.type === "system").map((coach) => (
                  <div
                    key={coach.id}
                    className={`rounded-lg border p-4 cursor-pointer transition-all ${
                      profile?.psychProfile?.coachId === coach.id ? "border-primary ring-2 ring-primary" : "hover:border-primary/50"
                    }`}
                    onClick={() => handleCoachSelect(coach.id)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <Image 
                          src={coach.image || "/placeholder.svg?height=100&width=100"} 
                          alt={coach.name} 
                          width={48} 
                          height={48} 
                          className="object-cover" 
                        />
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
                              setPreviewCoach(coach.id);
                              e.stopPropagation(); // Prevent selection
                              e.preventDefault(); // Ensure coach doesn't get selected
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
                            {coach.sampleQuotes && coach.sampleQuotes.map((quote: string, index: number) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-1">
                                  <Image
                                    src={coach.image || "/placeholder.svg?height=100&width=100"}
                                    alt={coach.name}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                  />
                                </div>
                                <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                                  <p className="text-sm">{quote}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}

                {/* Custom coaches the user has created */}
                {coaches.filter(c => c.type === "custom").map((coach) => (
                  <div
                    key={coach.id}
                    className={`rounded-lg border p-4 cursor-pointer transition-all ${
                      profile?.psychProfile?.coachId === coach.id ? "border-primary ring-2 ring-primary" : "hover:border-primary/50"
                    }`}
                    onClick={() => handleCoachSelect(coach.id)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-bold">{coach.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{coach.name}</h3>
                        <p className="text-xs text-muted-foreground">{coach.title || "Custom Coach"}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="mb-2">
                      {coach.style || "Custom"}
                    </Badge>
                    <p className="text-sm text-muted-foreground mb-3">{coach.description || "Your custom coach"}</p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="text-xs">
                        Custom
                      </Badge>
                      {profile?.psychProfile?.coachId === coach.id && (
                        <span className="text-sm text-primary">Selected</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="pt-4">
            <div className="space-y-6">
              <div>
                <Label htmlFor="custom-coach-name">Coach Name</Label>
                <Input
                  id="custom-coach-name"
                  placeholder="Enter a name for your coach"
                  value={customCoachName}
                  onChange={(e) => setCustomCoachName(e.target.value)}
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
                disabled={!customCoachName || saving}
                className="w-full mt-4"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Custom Coach"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      {(showBackButton || onComplete) && (
        <div className="px-6 pb-6 flex justify-between">
          {showBackButton && (
            <Button
              variant="outline"
              onClick={onBack}
            >
              Back
            </Button>
          )}
        </div>
      )}
    </Card>
  );
} 