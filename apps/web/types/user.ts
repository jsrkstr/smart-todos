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