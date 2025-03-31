export interface SubTask {
  id?: string
  title: string
  status: TaskStatus
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
  | 'five_min_before'
  | 'fifteen_min_before'
  | 'thirty_min_before'
  | 'one_hour_before'
  | 'one_day_before';

export type TaskStatus = "new" | "planned" | "completed";

export type TaskPriority = "low" | "medium" | "high";

export type TaskStage = "Refinement" | "Breakdown" | "Planning" | "Execution" | "Reflection";

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
  completed: boolean
  stage: TaskStage
  priority: TaskPriority
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

