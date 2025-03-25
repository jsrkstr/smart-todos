"use client"

import { useSettingsStore } from "@/lib/store/useSettingsStore"

export function useSettings() {
  const { 
    settings, 
    updateSettings 
  } = useSettingsStore()

  return {
    settings,
    updateSettings,
  }
}

