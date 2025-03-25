"use client"

import { useEffect, useCallback, useRef } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { useTaskStore } from "@/lib/store/useTaskStore"
import type { Task } from "@/types/task"

export function useTasks() {
  const { scheduleTaskReminder } = useNotifications()
  const { 
    tasks, 
    setNotificationHandler,
    addTask: storeAddTask, 
    toggleTaskCompletion, 
    deleteTask, 
    updateTask: storeUpdateTask 
  } = useTaskStore()
  
  // Use a ref to track if we've already set up the notification handler
  const handlerSetupRef = useRef(false)
  
  // Create a memoized notification setup function
  const setupNotifications = useCallback((tasks: Task[]) => {
    tasks.forEach((task: Task) => {
      if (!task.completed) {
        scheduleTaskReminder(task)
      }
    })
  }, [scheduleTaskReminder])
  
  // Set up notification handler only once
  useEffect(() => {
    if (!handlerSetupRef.current) {
      handlerSetupRef.current = true
      setNotificationHandler(setupNotifications)
    }
  }, [setNotificationHandler, setupNotifications]);

  // Get completed tasks
  const completedTasks = tasks.filter((task) => task.completed)

  // Add a new task with notification scheduling
  const addTask = async (task: Task) => {
    const newTask = await storeAddTask(task)
    if (newTask) {
      scheduleTaskReminder(newTask)
    }
    return newTask
  }

  // Update a task with notification rescheduling
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const updatedTask = await storeUpdateTask(taskId, updates)
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

