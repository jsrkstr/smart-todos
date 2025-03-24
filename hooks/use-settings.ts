"use client"

import { useState, useEffect } from "react"

interface Settings {
  theme: "light" | "dark" | "system"
  pomodoroDuration: string
  shortBreakDuration: string
  longBreakDuration: string
  soundEnabled: boolean
  notificationsEnabled: boolean
  emailNotifications: boolean
  reminderTime: string
}

const defaultSettings: Settings = {
  theme: "system",
  pomodoroDuration: "25",
  shortBreakDuration: "5",
  longBreakDuration: "15",
  soundEnabled: true,
  notificationsEnabled: true,
  emailNotifications: false,
  reminderTime: "30",
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("smartTodos-settings")
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings
    }
    return defaultSettings
  })

  // Save to localStorage whenever settings change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("smartTodos-settings", JSON.stringify(settings))
    }
  }, [settings])

  // Update settings
  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  return {
    settings,
    updateSettings,
  }
}

