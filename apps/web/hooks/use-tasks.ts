"use client"

import { useEffect, useCallback, useRef } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { useTaskStore } from "@/lib/store/useTaskStore"
import type { Task, Notification } from "@/types/task"
import { useTagStore } from "@/lib/store/useTagStore"

export function useTasks() {
  const { scheduleTaskReminder } = useNotifications()
  const {
    loading,
    initialized,
    tasks, 
    setNotificationHandler,
    addTask: storeAddTask, 
    toggleTaskCompletion, 
    deleteTask, 
    updateTask: storeUpdateTask,
    refineTask: storeRefineTask,
  } = useTaskStore()

  const { fetchTags } = useTagStore()
  
  // Use a ref to track if we've already set up the notification handler
  const handlerSetupRef = useRef<boolean>(false)
  
  // Create a memoized notification setup function
  const setupNotifications = useCallback((tasks: Task[]): void => {
    tasks.forEach((task: Task) => {
      if (!task.completed) {
        scheduleTaskReminder(task)
      }
    })
  }, [scheduleTaskReminder])
  
  // Set up notification handler only once
  useEffect((): void => {
    if (!handlerSetupRef.current) {
      handlerSetupRef.current = true
      setNotificationHandler(setupNotifications)
    }
  }, [setNotificationHandler, setupNotifications]);

  // Get completed tasks
  const completedTasks: Task[] = tasks.filter((task: Task) => task.completed)

  // Add a new task with notification scheduling
  const addTask = async (task: Partial<Task>): Promise<Task | null> => {
    // Prepare notifications if specified
    if (task.notifications) {
      // Ensure each notification has proper structure
      task.notifications = task.notifications.map(notification => ({
        ...notification,
        message: notification.message || `Reminder for: ${task.title}`,
      }))
    }
    
    const newTask: Task | null = await storeAddTask(task)
    if (newTask) {
      scheduleTaskReminder(newTask)
    }
    return newTask
  }

  // Update a task with notification rescheduling
  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    // Format children properly if needed
    if (updates.children) {
      // taskStore will handle the children format conversion
    }

    // Format notifications properly if needed
    if (updates.notifications) {
      // Ensure each notification has proper structure
      updates.notifications = updates.notifications.map(notification => ({
        ...notification,
        message: notification.message || `Reminder for task`,
      }))
    }

    const updatedTask: Task | null = await storeUpdateTask(taskId, updates)
    if (updatedTask && !updatedTask.completed) {
      scheduleTaskReminder(updatedTask)
    }
    return updatedTask
  }

  const refineTask = async (taskId: string): Promise<Task | null> => {
    const updatedTask: Task | null = await storeRefineTask(taskId)
    debugger;
    await fetchTags(true);
    return updatedTask;
  }

  return {
    loading,
    initialized,
    tasks,
    completedTasks,
    addTask,
    toggleTaskCompletion,
    deleteTask,
    updateTask,
    refineTask,
  }
}

