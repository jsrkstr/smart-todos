"use client"

import { useEffect, useRef } from "react"
import { useTaskStore } from "./useTaskStore"
import { useSettingsStore } from "./useSettingsStore"
import { useCalendarStore } from "./calendar-store/useCalendarStore"

export function StoreInitializer(): null {
  const { fetchTasks } = useTaskStore()
  const { fetchSettings } = useSettingsStore()
  const { fetchEvents } = useCalendarStore()
  const initialized = useRef<boolean>(false)

  useEffect((): void => {
    // Only initialize stores once
    if (!initialized.current) {
      initialized.current = true
      
      // Initialize stores on app startup
      fetchSettings()
      fetchTasks()
      fetchEvents()
    }
  }, [fetchSettings, fetchTasks, fetchEvents])

  // This component doesn't render anything
  return null
} 