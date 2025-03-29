import { Coach } from "@prisma/client"

export interface UserProfile {
  id?: string
  name: string
  email: string
  bio: string
  principles: string[]
  inspirations: string[]
  psychProfile?: PsychProfile
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
  coach?: Coach
  createdAt?: Date
  updatedAt?: Date
}

