import { create } from 'zustand'
import type { Task, TaskPriority, TaskStage } from '@/types/task'

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
  updateTaskStage: (taskId: string, stage: TaskStage) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  setupNotifications: null,

  setNotificationHandler: (handler: SetupNotificationsFunction): void => {
    // Only update if the handler is different or not set
    if (get().setupNotifications !== handler) {
      set({ setupNotifications: handler })
    }
  },

  fetchTasks: async (): Promise<void> => {
    // Skip if already loaded or loading
    if (get().tasks.length > 0 || get().loading) return
    
    set({ loading: true, error: null })
    try {
      const response: Response = await fetch('/api/tasks')
      if (!response.ok) {
        console.warn('Failed to load tasks, using empty task list')
        set({ 
          tasks: [],
          loading: false,
          error: 'Failed to load tasks'
        })
        return
      }
      const data: Task[] = await response.json()
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

  addTask: async (task: Partial<Task>): Promise<Task | null> => {
    const validatedTask: Task = {
      id: task.id || crypto.randomUUID(),
      title: task.title || '',
      date: task.date || new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      time: task.time,
      deadline: task.deadline,
      dateAdded: task.dateAdded || new Date().toISOString(),
      stage: task.stage || "Planning" as TaskStage,
      completed: task.completed || false,
      priority: task.priority || "Medium" as TaskPriority,
      location: task.location,
      why: task.why,
      reminderTime: task.reminderTime,
      children: task.children || []
    };

    try {
      // Validate task data before sending
      if (!validatedTask || !validatedTask.title) {
        console.error("Invalid task data:", validatedTask);
        throw new Error('Invalid task data');
      }
      
      console.log("Sending task to server:", JSON.stringify(validatedTask, null, 2));

      const response: Response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedTask),
      });
      
      if (!response.ok) {
        const errorData: { error: string } = await response.json();
        throw new Error(errorData.error || 'Failed to add task');
      }
      
      const newTask: Task = await response.json();
      set(state => ({ tasks: [newTask, ...state.tasks] }));
      return newTask;
    } catch (error) {
      console.error("Failed to add task:", error);
      set({ error: error instanceof Error ? error.message : 'Failed to add task' });
      return null;
    }
  },

  toggleTaskCompletion: async (taskId: string): Promise<void> => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      completed: !task.completed,
      stage: (!task.completed ? "Reflection" : "Execution") as TaskStage
    };

    try {
      await get().updateTask(taskId, updatedTask);
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t)
      }));
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  },

  deleteTask: async (taskId: string): Promise<void> => {
    try {
      const response: Response = await fetch('/api/tasks', {
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

  updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    try {
      const response: Response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, ...updates }),
      })
      if (!response.ok) {
        throw new Error('Failed to update task')
      }
      const updatedTask: Task = await response.json()
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

  updateTaskStage: async (taskId: string, stage: TaskStage): Promise<void> => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      stage,
      completed: stage === "Reflection" // Auto-complete when moved to Reflection stage
    };

    try {
      await get().updateTask(taskId, updatedTask);
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t)
      }));
    } catch (error) {
      console.error('Failed to update task stage:', error);
    }
  },
})) 