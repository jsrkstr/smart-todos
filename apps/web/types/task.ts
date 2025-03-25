export interface SubTask {
  title: string
  completed: boolean
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

export interface Task {
  id: string
  title: string
  date: string // Date for the task
  time?: string // Time for the task
  deadline?: string // Optional deadline
  dateAdded: string
  completed: boolean
  priority: "low" | "medium" | "high"
  location?: string
  why?: string
  subTasks?: SubTask[]
  reminderTime?: ReminderTimeOption // Changed to use the enum type
}

