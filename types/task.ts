export interface SubTask {
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  deadline: string
  dateAdded: string
  completed: boolean
  priority: "low" | "medium" | "high"
  location?: string
  why?: string
  subTasks?: SubTask[]
}

