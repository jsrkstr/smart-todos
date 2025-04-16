import { create } from 'zustand'
import type { Task, TaskPriority, TaskStage, Notification } from '@/types/task'
import type { NotificationCreateinput, NotificationUpdateInput } from '@/lib/services/taskService'
import { generateUUID } from '../utils'

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
  deleteTask: (taskId: string) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task | null>,
  refineTask: (taskId: string) => Promise<Task | null>
  breakdownTask: (taskId: string) => Promise<Task | null>
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
      id: task.id || generateUUID(),
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

    // Optimistically update the state with the new task
    const optimisticTask = validatedTask as Task;
    const previousTasks = get().tasks;
    set(state => ({ tasks: [optimisticTask, ...state.tasks] }));

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
        // Rollback optimistic update on error
        set({ tasks: previousTasks });
        throw new Error(errorData.error || 'Failed to add task');
      }
      
      const newTask: Task = await response.json();
      // Replace the optimistic task with the server response
      set(state => ({ 
        tasks: state.tasks.map(t => t.id === optimisticTask.id ? newTask : t) 
      }));
      return newTask;
    } catch (error) {
      console.error("Failed to add task:", error);
      // Ensure the optimistic update is rolled back
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add task',
        tasks: previousTasks
      });
      return null;
    }
  },

  deleteTask: async (taskId: string): Promise<void> => {
    // Save current state for potential rollback
    const previousTasks = get().tasks;
    
    // Optimistically remove the task
    set(state => ({
      tasks: state.tasks.filter(task => task.id !== taskId)
    }));

    try {
      const response: Response = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId }),
      })
      if (!response.ok) {
        // Rollback on error
        set({ tasks: previousTasks });
        throw new Error('Failed to delete task')
      }
      // Task is already removed from state, so no need to update again
    } catch (error) {
      console.error("Failed to delete task:", error)
      // Rollback to previous state
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete task',
        tasks: previousTasks 
      })
    }
  },

  updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    // Find current task
    const currentTask = get().tasks.find(t => t.id === taskId);
    if (!currentTask) return null;
    
    // Create optimistic updated task
    const optimisticTask = { ...currentTask, ...updates };
    
    // Save current state for potential rollback
    const previousTasks = get().tasks;
    
    // Optimistically update the task
    set(state => ({
      tasks: state.tasks.map(task => task.id === taskId ? optimisticTask : task)
    }));

    try {
      const payload: any = { id: taskId, ...updates };
      
      // Format children for API if provided
      if (updates.children) {
        // Extract current task to compare children
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
        // Rollback on error
        set({ tasks: previousTasks });
        throw new Error('Failed to update task')
      }
      const updatedTask: Task = await response.json()
      // Replace the optimistic task with the server response
      set(state => ({
        tasks: state.tasks.map(task => task.id === taskId ? updatedTask : task)
      }))
      return updatedTask
    } catch (error) {
      console.error("Failed to update task:", error)
      // Rollback to previous state
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task',
        tasks: previousTasks 
      })
      return null
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
  },

  breakdownTask: async (taskId: string): Promise<Task | null> => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return null;
    
    // Check if the task is in the correct stage to be broken down
    // Typically, this follows refinement completion
    if (!(task.stage === 'Refinement' && task.stageStatus === 'Completed') && task.stage !== 'Breakdown') {
      console.warn("Task is not in the correct stage for breakdown.");
      // Optionally update the task stage first if needed, or just return
      // For now, just return null if not ready
      // Or should we force the stage update here? Let's keep it strict for now.
      // await get().updateTask(taskId, { stage: 'Breakdown', stageStatus: 'NotStarted' });
      return null;
    }
    
    try {
      const response = await fetch('/api/tasks/breakdown', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: task.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to breakdown task')
      }

      const responseData = await response.json()
      
      // Check if the response contains a task or just a message (e.g., question)
      if (!responseData.task) {
        // Return null if it's a message/question response
        // The useTasks hook will handle this, potentially showing the message
        console.log("Breakdown resulted in a message/question: ", responseData.message);
        // Update the task locally if stageStatus changed (e.g., to QuestionAsked)
        // The API response doesn't guarantee the task object here, so fetch it or rely on subsequent updates
        // For now, return null and let useTasks handle state.
        return null; 
      }
      
      // Handle successful task update with sub-tasks
      const updatedTask = responseData.task;
      
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t)
      }))
      return updatedTask;
    } catch (error) {
      console.error('Error breaking down task:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to breakdown task' })
      return null
    }
  }
})) 