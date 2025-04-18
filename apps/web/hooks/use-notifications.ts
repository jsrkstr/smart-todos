"use client"

import { useState, useEffect } from "react"
import { useSettings } from "@/hooks/use-settings"
import { isMobileApp, sendToMobile } from "@/lib/mobileBridge"
import type { Task } from "@/types/task"

interface TaskReminder {
  id: string;
  title: string;
  date: string; // ISO date string including time
  reminderTime?: string;
}

export function useNotifications() {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false)
  const { settings } = useSettings()

  useEffect((): void => {
    // Check if browser supports notifications
    if (!isMobileApp() && !("Notification" in window)) {
      console.log("This browser does not support notifications")
      return
    }

    // Check if permission is already granted
    if (!isMobileApp() && Notification.permission === "granted") {
      setPermissionGranted(true)
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (isMobileApp()) {
      return true
    }

    if (!("Notification" in window)) {
      return false
    }

    if (Notification.permission === "granted") {
      setPermissionGranted(true)
      return true
    }

    if (Notification.permission !== "denied") {
      const permission: NotificationPermission = await Notification.requestPermission()
      const granted: boolean = permission === "granted"
      setPermissionGranted(granted)
      return granted
    }

    return false
  }

  const sendNotification = (title: string, options?: NotificationOptions): void => {
    if (!settings.notificationsEnabled) return

    if (isMobileApp()) {
      sendToMobile({
        type: 'SEND_NOTIFICATION',
        title,
        body: options?.body,
        data: options?.data,
      })
      return
    }

    if (!permissionGranted) {
      requestPermission().then((granted: boolean) => {
        if (granted) {
          new Notification(title, options)
        }
      })
      return
    }

    new Notification(title, options)
  }

  const scheduleTaskReminder = (task: TaskReminder): void => {
    if (!permissionGranted) {
      console.warn("Notification permission not granted")
      return
    }

    // Ensure we have a valid date
    if (!task.date) {
      console.warn("Task has no date, cannot schedule reminder")
      return
    }

    const taskDate: Date = new Date(task.date)

    let reminderTime: Date
    if (task.reminderTime) {
      reminderTime = new Date(task.reminderTime)
    } else {
      const reminderMinutes: number = settings.defaultReminderTime || 0
      reminderTime = new Date(taskDate.getTime() - reminderMinutes * 60 * 1000)
    }

    // If reminder time is in the past, don't schedule
    if (reminderTime <= new Date()) return

    const timeUntilReminder: number = reminderTime.getTime() - Date.now()

    setTimeout(() => {
      sendNotification(`Task Reminder: ${task.title}`, {
        body: `This task is scheduled for ${taskDate.toLocaleString()}`,
        icon: "/favicon.ico",
        tag: `task-reminder-${task.id}`,
      })
    }, timeUntilReminder)
  }

  return {
    permissionGranted,
    requestPermission,
    sendNotification,
    scheduleTaskReminder,
  }
}

