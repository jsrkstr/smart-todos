"use client"

import { useSettingsStore } from "@/lib/store/useSettingsStore"

// Import the Settings type from the store
type Settings = {
  theme: "light" | "dark" | "system";
  pomodoroDuration: string;
  shortBreakDuration: string;
  longBreakDuration: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  reminderTime: string;
}

interface UseSettingsReturn {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<Settings | null>;
}

export function useSettings(): UseSettingsReturn {
  const { 
    settings, 
    updateSettings 
  } = useSettingsStore()

  return {
    settings,
    updateSettings,
  }
}

