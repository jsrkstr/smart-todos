"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useProfile } from "@/hooks/use-profile"
import { PrincipleSource } from "@/types/principle"
import { Loader2 } from "lucide-react"
import { PsychProfile } from "@/types/user"
import { Progress } from "@/components/ui/progress"
import { ChevronRight, Sun, Moon, Zap } from "lucide-react"

const ONBOARDING_QUESTIONS = [
  {
    id: "productivityTime",
    question: "When are you most productive?",
    options: [
      { value: "morning", label: "Morning (5am - 12pm)" },
      { value: "afternoon", label: "Afternoon (12pm - 5pm)" },
      { value: "evening", label: "Evening (5pm - 10pm)" },
      { value: "night", label: "Night (10pm - 5am)" }
    ]
  },
  {
    id: "communicationPref",
    question: "How would you like to receive reminders?",
    options: [
      { value: "minimal", label: "Minimal - only essential notifications" },
      { value: "moderate", label: "Moderate - important reminders" },
      { value: "frequent", label: "Frequent - keep me updated regularly" }
    ]
  },
  {
    id: "taskApproach",
    question: "How do you prefer to tackle tasks?",
    options: [
      { value: "sequential", label: "One at a time, in sequence" },
      { value: "parallel", label: "Multiple tasks at once" },
      { value: "varied", label: "Depends on the task" }
    ]
  },
  {
    id: "difficultyPreference",
    question: "When do you prefer to tackle difficult tasks?",
    options: [
      { value: "first", label: "Do difficult tasks first" },
      { value: "alternate", label: "Alternate between easy and difficult" },
      { value: "end", label: "Do difficult tasks last" }
    ]
  },
  {
    id: "reminderTiming",
    question: "How much advance notice do you prefer for task reminders?",
    options: [
      { value: "just_in_time", label: "Just in time" },
      { value: "15min", label: "15 minutes before" },
      { value: "30min", label: "30 minutes before" },
      { value: "1hour", label: "1 hour before" }
    ]
  }
]

const PRINCIPLE_SOURCES: PrincipleSource[] = [
  { id: "1", name: "Steve Jobs", description: "Focus on simplicity and perfection", type: "famous personality" },
  { id: "2", name: "Elon Musk", description: "First principles thinking and ambitious goals", type: "famous personality" },
  { id: "3", name: "Marie Kondo", description: "Focus on what sparks joy and decluttering", type: "famous personality" },
  { id: "4", name: "Naval Ravikant", description: "Leverage and specific knowledge", type: "famous personality" },
  { id: "5", name: "David Allen (GTD)", description: "Getting Things Done methodology", type: "methodology" }
]

const steps = [
  "Welcome",
  "Productivity Profile",
  "Communication",
  "Task Approach",
  "Task Timing",
  "Coach Selection",
  "Complete",
]

export function UserOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedCoach, setSelectedCoach] = useState<string>("")
  const [selectedPrinciples, setSelectedPrinciples] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { updateProfile } = useProfile()
  
  const progress = (currentStep / (steps.length - 1)) * 100
  const currentQuestion = currentStep < ONBOARDING_QUESTIONS.length ? ONBOARDING_QUESTIONS[currentStep] : null
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleAnswerChange = (value: string) => {
    if (currentQuestion) {
      setAnswers({
        ...answers,
        [currentQuestion.id]: value
      })
    }
  }
  
  const handleCoachSelect = (coach: string) => {
    setSelectedCoach(coach)
  }
  
  const handlePrincipleToggle = (principle: string) => {
    if (selectedPrinciples.includes(principle)) {
      setSelectedPrinciples(selectedPrinciples.filter(p => p !== principle))
    } else {
      setSelectedPrinciples([...selectedPrinciples, principle])
    }
  }
  
  const completeOnboarding = async () => {
    setIsLoading(true)
    try {
      // Create psychological profile
      const psychProfile: PsychProfile = {
        userId: "", // Will be set by the API
        productivityTime: answers.productivityTime,
        communicationPref: answers.communicationPref,
        taskApproach: answers.taskApproach,
        difficultyPreference: answers.difficultyPreference,
        reminderTiming: answers.reminderTiming,
        selectedCoach: selectedCoach
      }
      
      await updateProfile({
        preferences: answers,
        coach: selectedCoach,
        principles: selectedPrinciples,
        psychProfile
      })
      
      setIsComplete(true)
    } catch (error) {
      console.error("Failed to save onboarding data:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Show success screen after onboarding is complete
  if (isComplete) {
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
          <Button onClick={() => window.location.href = "/"}>Go to Dashboard</Button>
        </CardFooter>
      </Card>
    )
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">{steps[currentStep]}</h2>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
      </div>

      {currentStep === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to SmartTodos</CardTitle>
            <CardDescription>
              Let's set up your personalized experience to help you complete tasks effectively.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              During this onboarding process, we'll ask you some questions to understand your preferences, work habits,
              and psychological profile. This will help us tailor the app to your unique needs.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col items-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                <Sun className="h-8 w-8 mb-2 text-yellow-500" />
                <h3 className="font-medium">Personalized Experience</h3>
                <p className="text-sm text-center text-muted-foreground">Tailored to your unique work style</p>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                <Moon className="h-8 w-8 mb-2 text-blue-500" />
                <h3 className="font-medium">Psychological Profile</h3>
                <p className="text-sm text-center text-muted-foreground">Adaptive to your behavioral patterns</p>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                <Zap className="h-8 w-8 mb-2 text-amber-500" />
                <h3 className="font-medium">Motivational Coaching</h3>
                <p className="text-sm text-center text-muted-foreground">Customized encouragement and support</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div></div>
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ) : currentQuestion ? (
        <Card>
          <CardHeader>
            <CardTitle>{currentQuestion.question}</CardTitle>
            <CardDescription>
              Choose the option that best matches your preference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={answers[currentQuestion.id] || ""} 
              onValueChange={handleAnswerChange}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1">{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
            >
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Choose your coach</CardTitle>
            <CardDescription>
              Select a coach whose principles will guide your task management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Select value={selectedCoach} onValueChange={handleCoachSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a coach" />
              </SelectTrigger>
              <SelectContent>
                {PRINCIPLE_SOURCES.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name} - {source.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedCoach && (
              <div className="space-y-4">
                <h4 className="font-medium">Select principles you'd like to follow:</h4>
                <div className="space-y-3">
                  {PRINCIPLE_SOURCES.find(source => source.id === selectedCoach)?.name === "Steve Jobs" && (
                    <>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="focus" 
                          checked={selectedPrinciples.includes("focus")}
                          onCheckedChange={() => handlePrincipleToggle("focus")}
                        />
                        <Label htmlFor="focus">Focus on what truly matters</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="simplicity" 
                          checked={selectedPrinciples.includes("simplicity")}
                          onCheckedChange={() => handlePrincipleToggle("simplicity")}
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
                          onCheckedChange={() => handlePrincipleToggle("first_principles")}
                        />
                        <Label htmlFor="first_principles">First principles thinking</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="ambitious_goals" 
                          checked={selectedPrinciples.includes("ambitious_goals")}
                          onCheckedChange={() => handlePrincipleToggle("ambitious_goals")}
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
                          onCheckedChange={() => handlePrincipleToggle("joy")}
                        />
                        <Label htmlFor="joy">Choose tasks that spark joy</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="declutter" 
                          checked={selectedPrinciples.includes("declutter")}
                          onCheckedChange={() => handlePrincipleToggle("declutter")}
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
                          onCheckedChange={() => handlePrincipleToggle("leverage")}
                        />
                        <Label htmlFor="leverage">Seek leverage in your tasks</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="specific_knowledge" 
                          checked={selectedPrinciples.includes("specific_knowledge")}
                          onCheckedChange={() => handlePrincipleToggle("specific_knowledge")}
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
                          onCheckedChange={() => handlePrincipleToggle("capture")}
                        />
                        <Label htmlFor="capture">Capture everything</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox 
                          id="next_action" 
                          checked={selectedPrinciples.includes("next_action")}
                          onCheckedChange={() => handlePrincipleToggle("next_action")}
                        />
                        <Label htmlFor="next_action">Define next actions</Label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!selectedCoach}
            >
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
      )}
    </div>
  )
} 