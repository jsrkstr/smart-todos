"use client"

import { useEffect, useRef } from "react"
import { useTaskStore } from "./useTaskStore"
import { useSettingsStore } from "./useSettingsStore"

export function StoreInitializer() {
  const { fetchTasks } = useTaskStore()
  const { fetchSettings } = useSettingsStore()
  const initialized = useRef(false)

  useEffect(() => {
    // Only initialize stores once
    if (!initialized.current) {
      initialized.current = true
      
      // Initialize stores on app startup
      fetchSettings()
      fetchTasks()
    }
  }, [fetchSettings, fetchTasks])

  // This component doesn't render anything
  return null
} 