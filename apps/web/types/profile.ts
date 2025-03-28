export interface UserProfile {
  id?: string
  name: string
  email: string
  bio: string
  principles: string[]
  inspirations: string[]
  psychProfile?: PsychProfile
  coach?: string  // Used for coach selection updates
}

export interface PsychProfile {
  id?: string
  userId?: string
  productivityTime: string
  communicationPref: string
  taskApproach: string
  difficultyPreference: string
  reminderTiming?: string
  selectedCoach?: string
  coachId?: string
  createdAt?: Date
  updatedAt?: Date
}

