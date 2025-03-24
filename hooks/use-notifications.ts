"use client"

import { useState, useEffect } from "react"
import { useSettings } from "@/hooks/use-settings"

export function useNotifications() {
  const [permissionGranted, setPermissionGranted] = useState(false)
  const { settings } = useSettings()

  useEffect(() => {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications")
      return
    }

    // Check if permission is already granted
    if (Notification.permission === "granted") {
      setPermissionGranted(true)
    }
  }, [])

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      return false
    }

    if (Notification.permission === "granted") {
      setPermissionGranted(true)
      return true
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      const granted = permission === "granted"
      setPermissionGranted(granted)
      return granted
    }

    return false
  }

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!permissionGranted) {
      requestPermission().then((granted) => {
        if (granted) {
          new Notification(title, options)
        }
      })
      return
    }

    new Notification(title, options)
  }

  const scheduleTaskReminder = (task: { id: string; title: string; deadline: string; time?: string }) => {
    if (!settings.notificationsEnabled) return

    const deadlineDate = new Date(task.deadline)
    const reminderMinutes = Number.parseInt(settings.reminderTime || "30")

    // If task has a specific time, use it
    if (task.time) {
      const [hours, minutes] = task.time.split(":").map(Number)
      deadlineDate.setHours(hours, minutes, 0, 0)
    }

    // Calculate reminder time
    const reminderTime = new Date(deadlineDate.getTime() - reminderMinutes * 60 * 1000)

    // If reminder time is in the past, don't schedule
    if (reminderTime <= new Date()) return

    const timeUntilReminder = reminderTime.getTime() - Date.now()

    setTimeout(() => {
      sendNotification(`Task Reminder: ${task.title}`, {
        body: `Your task is due ${reminderMinutes === 1440 ? "tomorrow" : `in ${reminderMinutes} minutes`}`,
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

