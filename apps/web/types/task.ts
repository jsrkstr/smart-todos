export interface SubTask {
  title: string
  completed: boolean
}

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
  reminderTime?: string // Custom reminder time for the task
}

