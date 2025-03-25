"use client"

import { useSettingsStore } from "@/lib/store/useSettingsStore"
import type { ReminderTimeOption } from "@/types/task"

export interface Settings {
  theme: string;
  pomodoroDuration: string;
  shortBreakDuration: string;
  longBreakDuration: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  reminderTime: ReminderTimeOption;
}

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

