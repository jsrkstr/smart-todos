"use client"

import { useSettingsStore } from "@/lib/store/useSettingsStore"

// Import the Settings type from the store
type Settings = {
  theme: "light" | "dark" | "system";
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
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

