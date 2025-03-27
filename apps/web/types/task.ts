export interface SubTask {
  id?: string
  title: string
  status: boolean
  taskId?: string
  position?: number
  estimatedTimeMinutes?: number
  date?: string
  rank?: number
  events?: Event[]
  notifications?: Notification[]
}

export type ReminderTimeOption = 
  | "at_time" 
  | "5_minutes" 
  | "10_minutes" 
  | "15_minutes" 
  | "30_minutes" 
  | "1_hour" 
  | "2_hours" 
  | "1_day";

export type TaskStatus = "new" | "planned" | "completed";

export interface Tag {
  id?: string
  name: string
  color?: string
  categoryId?: string
}

export interface Event {
  id?: string
  summary: string
  description?: string
  start: string
  end: string
  recurrence?: string[]
}

export interface Notification {
  id?: string
  title: string
  subtitle?: string
  metadata?: any
  mode: "phone_call" | "chat_message" | "alarm" | "push_notification"
  type: "info" | "question" | "reminder"
  status: string
  trigger: "location" | "time"
  triggerAt?: string
  location?: string
}

export interface Task {
  id: string
  title: string
  date: string // Date for the task
  time?: string // Time for the task
  deadline?: string // Optional deadline
  dateAdded: string
  status: TaskStatus
  priority: "low" | "medium" | "high"
  position?: number
  tags?: Tag[]
  estimatedTimeMinutes?: number
  repeats?: string
  location?: string
  why?: string
  reminderTime?: ReminderTimeOption
  subTasks?: SubTask[]
  events?: Event[]
  notifications?: Notification[]
}

