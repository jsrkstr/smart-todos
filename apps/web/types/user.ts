export interface User {
  id?: string
  name: string
  email: string
  bio?: string
  gender?: string
  age?: number
  principles?: string[]
  inspirations?: string[]
}

export interface UserInsight {
  id?: string
  content: string
  authorId: string
  author?: User
}

export interface Settings {
  id?: string
  theme: string
  pomodoroDuration: string
  shortBreakDuration: string
  longBreakDuration: string
  soundEnabled: boolean
  notificationsEnabled: boolean
  emailNotifications: boolean
  userId: string
  reminderTime: string
}

export interface PsychProfile {
  userId: string
  productivityTime: string  // morning, afternoon, evening, night
  communicationPref: string  // minimal, moderate, frequent
  taskApproach: string  // sequential, parallel, varied
  difficultyPreference: string  // first, alternate, end
  reminderTiming: string  // just_in_time, 15min, 30min, 1hour
  selectedCoach: string
}

export interface OnboardingAnswers {
  productivityTime?: string
  communicationPref?: string
  taskApproach?: string
  difficultyPreference?: string
  reminderTiming?: string
  [key: string]: string | undefined
}

export interface ProfileUpdateData {
  preferences?: OnboardingAnswers
  coach?: string
  coachName?: string
  principles?: string[]
  integrations?: string[]
  psychProfile?: PsychProfile
} 