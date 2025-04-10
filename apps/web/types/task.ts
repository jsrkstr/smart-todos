// export interface SubTask { // REMOVED
//   id?: string
//   title: string
//   status: TaskStatus
//   taskId?: string
//   position?: number
//   estimatedTimeMinutes?: number
//   date?: string
//   rank?: number
//   notifications?: Notification[]
// }

export type ReminderTimeOption = 
  | "at_time" 
  | 'five_min_before'
  | 'fifteen_min_before'
  | 'thirty_min_before'
  | 'one_hour_before'
  | 'one_day_before';

// export type TaskStatus = "new" | "planned" | "completed"; // REMOVED

export type TaskPriority = "low" | "medium" | "high";

export type TaskStage = "Refinement" | "Breakdown" | "Planning" | "Execution" | "Reflection";

export interface Tag {
  id?: string
  name: string
  color: string
  categoryId?: string
  category?: TagCategory
}

export interface TagCategory {
  id?: string
  name: string
  tags?: Tag[]
}

export interface Notification {
  id?: string
  message?: string
  mode: "Push" | "Chat" | "Email";
  type: "Info" | "Question" | "Reminder"
  trigger?: "FixedTime" | "RelativeTime" | "Location"
  relativeTimeValue: number;
  relativeTimeUnit: "Minutes" | "Hours" | "Days"
  author: "User" | "Bot" | "Model"
  isNew?: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
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
  repeatRule?: string // RFC 5545 RRULE string
  // subTasks?: SubTask[] // REMOVED
  notifications?: Notification[]

  // --- Added for subtask replacement ---
  parentId?: string
  parent?: Task
  children?: Task[]
  // --- End added fields ---
}

