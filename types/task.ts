export interface SubTask {
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  deadline: string
  time?: string // Added time field
  dateAdded: string
  completed: boolean
  priority: "low" | "medium" | "high"
  location?: string
  why?: string
  subTasks?: SubTask[]
}

