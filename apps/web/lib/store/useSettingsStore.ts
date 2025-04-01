import { create } from 'zustand'

interface Settings {
  theme: "light" | "dark" | "system"
  pomodoroDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  soundEnabled: boolean
  notificationsEnabled: boolean
  emailNotifications: boolean
  defaultReminderTime: number
}

const defaultSettings: Settings = {
  theme: "system",
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  soundEnabled: true,
  notificationsEnabled: true,
  emailNotifications: false,
  defaultReminderTime: 0,
}

interface SettingsStore {
  settings: Settings
  loading: boolean
  error: string | null
  loaded: boolean
  
  // Actions
  fetchSettings: () => Promise<void>
  updateSettings: (updates: Partial<Settings>) => Promise<Settings | null>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  loading: false,
  error: null,
  loaded: false,

  fetchSettings: async (): Promise<void> => {
    // Skip if already loaded or loading
    if (get().loaded || get().loading) return
    
    set({ loading: true, error: null })
    try {
      const response: Response = await fetch('/api/settings')
      if (!response.ok) {
        console.warn('Failed to load settings, using defaults')
        set({ 
          settings: defaultSettings, 
          loading: false, 
          loaded: true,
          error: null 
        })
        return
      }
      const data: Settings = await response.json()
      set({ settings: data, loading: false, loaded: true })
    } catch (error) {
      console.error("Failed to load settings:", error)
      // Fall back to default settings instead of showing an error
      set({ 
        settings: defaultSettings,
        error: error instanceof Error ? error.message : 'Failed to load settings', 
        loading: false,
        loaded: true // Mark as loaded even on error to prevent repeated attempts
      })
    }
  },

  updateSettings: async (updates: Partial<Settings>): Promise<Settings | null> => {
    try {
      const response: Response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('Failed to update settings')
      }
      const data: Settings = await response.json()
      set({ settings: data })
      return data
    } catch (error) {
      console.error("Failed to update settings:", error)
      set({ error: error instanceof Error ? error.message : 'Failed to update settings' })
      return null
    }
  },
})) 