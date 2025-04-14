import { create } from 'zustand'
import type { Task, TaskPriority, TaskStage, Notification } from '@/types/task'
import type { NotificationCreateinput, NotificationUpdateInput } from '@/lib/services/taskService'

type SetupNotificationsFunction = (tasks: Task[]) => void

interface TaskStore {
  tasks: Task[]
  loading: boolean
  initialized: boolean
  error: string | null
  setupNotifications: SetupNotificationsFunction | null
  
  // Actions
  setNotificationHandler: (handler: SetupNotificationsFunction) => void
  fetchTasks: (force: boolean) => Promise<void>
  addTask: (task: Partial<Task>) => Promise<Task | null>
  toggleTaskCompletion: (taskId: string) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task | null>,
  refineTask: (taskId: string) => Promise<Task | null>
  updateTaskStage: (taskId: string, stage: TaskStage) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  initialized: false,
  error: null,
  setupNotifications: null,

  setNotificationHandler: (handler: SetupNotificationsFunction): void => {
    // Only update if the handler is different or not set
    if (get().setupNotifications !== handler) {
      set({ setupNotifications: handler })
    }
  },

  fetchTasks: async (force = false): Promise<void> => {
    // Skip if already loaded or loading
    if (!force && (get().tasks.length > 0 || get().loading)) return
    
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
      set({ tasks: data, loading: false, initialized: true })
      
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
    const validatedTask: any = {
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
      parentId: task.parentId,
    };

    // Format children for API
    if (task.children && task.children.length > 0) {
      validatedTask.children = task.children.map(child => ({
        title: child.title,
        description: child.description,
        priority: child.priority || 'medium'
      }));
    }

    // Format notifications for API
    if (task.notifications && task.notifications.length > 0) {
      validatedTask.notifications = task.notifications.map((notification: Notification) => ({
        message: notification.message || `Reminder for: ${task.title}`,
        mode: notification.mode,
        type: notification.type,
        trigger: notification.trigger,
        relativeTimeValue: notification.relativeTimeValue,
        relativeTimeUnit: notification.relativeTimeUnit,
        author: notification.author
      }));
    }

    try {
      // Validate task data before sending
      if (!validatedTask) {
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
      const payload: any = { id: taskId, ...updates };
      
      // Format children for API if provided
      if (updates.children) {
        // Extract current task to compare children
        const currentTask = get().tasks.find(t => t.id === taskId);
        const currentChildren = currentTask?.children || [];
        
        // Sort children into create, update, and remove arrays
        const createChildren = updates.children.filter(c => !c.id);
        const updateChildren = updates.children.filter(c => !!c.id);
        const removeIds = currentChildren
          .filter(c => !updates.children?.some(uc => uc.id === c.id))
          .map(c => c.id);
        
        payload.children = {
          create: createChildren.map(c => ({
            title: c.title,
            description: c.description
          })),
          update: updateChildren.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description
          })),
          removeIds: removeIds
        };
      }

      // Format notifications for API if provided
      if (updates.notifications) {
        // Extract current task to compare notifications
        const currentTask = get().tasks.find(t => t.id === taskId);
        const currentNotifications = currentTask?.notifications || [];

        updates.notifications = updates.notifications.map(n => {
          if (n.isNew) {
            n.id = undefined;
          }
          return n;
        })
        
        // Sort notifications into create, update, and remove arrays
        const createNotifications = updates.notifications.filter(n => !n.id);
        const updateNotifications = updates.notifications.filter(n => !!n.id);
        const removeIds = currentNotifications
          .filter(n => !updates.notifications?.some(un => un.id === n.id))
          .map(n => n.id);
        
        payload.notifications = {
          create: createNotifications.map(n => ({
            message: n.message || `Reminder for task`,
            mode: n.mode,
            type: n.type,
            trigger: n.trigger,
            relativeTimeValue: n.relativeTimeValue,
            relativeTimeUnit: n.relativeTimeUnit,
            author: n.author
          })),
          update: updateNotifications.map(n => ({
            id: n.id,
            message: n.message,
            mode: n.mode,
            type: n.type,
            trigger: n.trigger,
            relativeTimeValue: n.relativeTimeValue,
            relativeTimeUnit: n.relativeTimeUnit,
            author: n.author
          })),
          removeIds: removeIds
        };
      }

      const response: Response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  refineTask: async (taskId: string): Promise<Task | null> => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return null;
    
    try {
      const response = await fetch('/api/tasks/refine', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: task.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to refine task')
      }

      const responseData = await response.json()
      
      // Check if the response contains a question
      if (responseData.task === null) {
        // Return null if it's a question response
        // The useTasks hook will handle this case
        return null;
      }
      
      // Otherwise, handle a successful task update
      const updatedTask = responseData.task;
      
      set(state => ({
        tasks: state.tasks.map(task => task.id === taskId ? updatedTask : task)
      }))
      return updatedTask;
    } catch (error) {
      console.error('Error refining task:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to refine task' })
      return null
    }
  }
})) 