export interface OnboardingOption {
  value: string;
  label: string;
}

export interface OnboardingQuestion {
  id: string;
  question: string;
  options: OnboardingOption[];
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
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
];

export const PRINCIPLE_SOURCES = [
  { id: "1", name: "Steve Jobs", description: "Focus on simplicity and perfection", type: "famous personality" },
  { id: "2", name: "Elon Musk", description: "First principles thinking and ambitious goals", type: "famous personality" },
  { id: "3", name: "Marie Kondo", description: "Focus on what sparks joy and decluttering", type: "famous personality" },
  { id: "4", name: "Naval Ravikant", description: "Leverage and specific knowledge", type: "famous personality" },
  { id: "5", name: "David Allen (GTD)", description: "Getting Things Done methodology", type: "methodology" }
];

export const ONBOARDING_STEPS = [
  "Welcome",
  "Productivity Profile",
  "Communication",
  "Task Approach",
  "Task Timing",
  "Coach Selection",
  "Integrations",
  "Complete",
]; 