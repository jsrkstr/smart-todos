"use client"

import { useEffect, useCallback, useRef } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { useTaskStore } from "@/lib/store/useTaskStore"
import type { Task, Notification } from "@/types/task"

interface UseTasksOptions {
  includeCompleted?: boolean
}

export function useTasks(options: UseTasksOptions = {}) {
  const { includeCompleted = false } = options
  const { scheduleTaskReminder } = useNotifications()
  const { 
    tasks: allTasks, 
    setNotificationHandler,
    addTask: storeAddTask, 
    toggleTaskCompletion, 
    deleteTask, 
    updateTask: storeUpdateTask 
  } = useTaskStore()
  
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

  // Filter tasks based on includeCompleted option
  const tasks = includeCompleted
    ? allTasks
    : allTasks.filter((task: Task) => !task.completed)

  // Get completed tasks
  const completedTasks: Task[] = allTasks.filter((task: Task) => task.completed)

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

  return {
    tasks,
    completedTasks,
    addTask,
    toggleTaskCompletion,
    deleteTask,
    updateTask,
  }
} 