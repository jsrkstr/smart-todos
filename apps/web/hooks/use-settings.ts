"use client"

import { useSettingsStore } from '@/lib/store/useSettingsStore'
import type { ReminderTimeOption } from '@/types/task'

export function useSettings() {
  const { settings, updateSettings, resetSettings } = useSettingsStore()

  const updateReminderTime = (reminderTime: ReminderTimeOption) => {
    updateSettings({ reminderTime })
  }

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !settings.darkMode })
  }

  const toggleNotifications = () => {
    updateSettings({ notifications: !settings.notifications })
  }

  return {
    settings,
    updateSettings,
    resetSettings,
    updateReminderTime,
    toggleDarkMode,
    toggleNotifications
  }
}

