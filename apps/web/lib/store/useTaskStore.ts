import { create } from 'zustand'
import type { Task } from '@/types/task'

type SetupNotificationsFunction = (tasks: Task[]) => void

interface TaskStore {
  tasks: Task[]
  loading: boolean
  error: string | null
  setupNotifications: SetupNotificationsFunction | null
  
  // Actions
  setNotificationHandler: (handler: SetupNotificationsFunction) => void
  fetchTasks: () => Promise<void>
  addTask: (task: Task) => Promise<Task | null>
  toggleTaskCompletion: (taskId: string) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task | null>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  setupNotifications: null,

  setNotificationHandler: (handler: SetupNotificationsFunction) => {
    // Only update if the handler is different or not set
    if (get().setupNotifications !== handler) {
      set({ setupNotifications: handler })
    }
  },

  fetchTasks: async () => {
    // Skip if already loaded or loading
    if (get().tasks.length > 0 || get().loading) return
    
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/tasks')
      if (!response.ok) {
        throw new Error('Failed to load tasks')
      }
      const data = await response.json()
      set({ tasks: data, loading: false })
      
      // Schedule notifications for tasks if handler is set
      const { setupNotifications } = get()
      if (setupNotifications) {
        setupNotifications(data)
      }
    } catch (error) {
      console.error("Failed to load tasks:", error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load tasks', 
        loading: false,
        tasks: []
      })
    }
  },

  addTask: async (task: Task) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      if (!response.ok) {
        throw new Error('Failed to add task')
      }
      const newTask = await response.json()
      set(state => ({ tasks: [newTask, ...state.tasks] }))
      return newTask
    } catch (error) {
      console.error("Failed to add task:", error)
      set({ error: error instanceof Error ? error.message : 'Failed to add task' })
      return null
    }
  },

  toggleTaskCompletion: async (taskId: string) => {
    const task = get().tasks.find(t => t.id === taskId)
    if (!task) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          completed: !task.completed
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to toggle task completion')
      }
      const updatedTask = await response.json()
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t)
      }))
    } catch (error) {
      console.error("Failed to toggle task completion:", error)
      set({ error: error instanceof Error ? error.message : 'Failed to toggle task' })
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId }),
      })
      if (!response.ok) {
        throw new Error('Failed to delete task')
      }
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== taskId)
      }))
    } catch (error) {
      console.error("Failed to delete task:", error)
      set({ error: error instanceof Error ? error.message : 'Failed to delete task' })
    }
  },

  updateTask: async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, ...updates }),
      })
      if (!response.ok) {
        throw new Error('Failed to update task')
      }
      const updatedTask = await response.json()
      set(state => ({
        tasks: state.tasks.map(task => task.id === taskId ? updatedTask : task)
      }))
      return updatedTask
    } catch (error) {
      console.error("Failed to update task:", error)
      set({ error: error instanceof Error ? error.message : 'Failed to update task' })
      return null
    }
  },
})) 