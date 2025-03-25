"use client"

import { useState, useEffect } from "react"
import { useSettings } from "@/hooks/use-settings"
import { isMobileApp, sendToMobile } from "@/lib/mobileBridge"

export function useNotifications() {
  const [permissionGranted, setPermissionGranted] = useState(false)
  const { settings } = useSettings()

  useEffect(() => {
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

  const requestPermission = async () => {
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
      const permission = await Notification.requestPermission()
      const granted = permission === "granted"
      setPermissionGranted(granted)
      return granted
    }

    return false
  }

  const sendNotification = (title: string, options?: NotificationOptions) => {
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
      requestPermission().then((granted) => {
        if (granted) {
          new Notification(title, options)
        }
      })
      return
    }

    new Notification(title, options)
  }

  const scheduleTaskReminder = (task: { id: string; title: string; date: string; time?: string; reminderTime?: string }) => {
    if (!settings.notificationsEnabled) return

    if (isMobileApp()) {
      sendToMobile({
        type: 'UPDATE_TASKS',
        tasks: JSON.parse(localStorage.getItem('smartTodos-tasks') || '[]')
      })
      return
    }

    const taskDate = new Date(task.date)
    if (task.time) {
      const [hours, minutes] = task.time.split(":").map(Number)
      taskDate.setHours(hours, minutes, 0, 0)
    }

    let reminderTime: Date
    if (task.reminderTime) {
      reminderTime = new Date(task.reminderTime)
    } else {
      const reminderMinutes = Number.parseInt(settings.reminderTime || "30")
      reminderTime = new Date(taskDate.getTime() - reminderMinutes * 60 * 1000)
    }

    // If reminder time is in the past, don't schedule
    if (reminderTime <= new Date()) return

    const timeUntilReminder = reminderTime.getTime() - Date.now()

    setTimeout(() => {
      sendNotification(`Task Reminder: ${task.title}`, {
        body: `Your task is scheduled for ${taskDate.toLocaleString()}`,
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

