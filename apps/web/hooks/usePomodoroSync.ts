"use client"

import { useState, useEffect, useCallback } from "react"
import { useSessionStorage } from "@/hooks/useSessionStorage"
import { useSettings } from "@/hooks/use-settings"

// Types
export type TimerMode = "focus" | "shortBreak" | "longBreak"
export type TaskMode = "single" | "multi" | "free"
export type PomodoroStatus = "active" | "finished" | "cancelled"

export interface TaskItem {
  id: string
  title?: string
  position?: number
  completed?: boolean
}

export interface PomodoroState {
  active: boolean
  id?: string
  type: TimerMode
  startTime?: Date
  endTime?: Date
  remainingTime: number
  status: PomodoroStatus
  taskMode: TaskMode
  tasks: TaskItem[]
}

export function usePomodoroSync() {
  const { settings } = useSettings()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default state with no active pomodoro
  const defaultState: PomodoroState = {
    active: false,
    type: "focus",
    status: "finished",
    remainingTime: 0,
    taskMode: "single",
    tasks: []
  }
  
  // Store state in session storage for cross-tab sync and serve as a cache
  const [syncState, setSyncState] = useSessionStorage<PomodoroState>(
    "pomodoro-state", 
    defaultState
  )

  // Fetch active pomodoro from the API on initial load
  useEffect(() => {
    const fetchActivePomodoroFromAPI = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/pomodoro')
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        
        // If there's an active pomodoro in the database, use it
        if (data.active) {
          const pomodoroState: PomodoroState = {
            active: true,
            id: data.id,
            type: data.type as TimerMode,
            startTime: new Date(data.startTime),
            remainingTime: data.remainingTime,
            status: 'active',
            taskMode: data.taskMode as TaskMode,
            tasks: data.tasks || []
          }
          setSyncState(pomodoroState)
        }
      } catch (err) {
        console.error("Error fetching active pomodoro:", err)
        setError("Failed to load pomodoro session")
        
        // If API fails, fall back to session storage
        const storedState = window.sessionStorage.getItem("pomodoro-state")
        if (storedState) {
          try {
            setSyncState(JSON.parse(storedState))
          } catch (parseErr) {
            console.error("Error parsing stored pomodoro state", parseErr)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchActivePomodoroFromAPI()
  }, [])
  
  /**
   * Start a new Pomodoro session
   */
  const startPomodoro = useCallback(
    async (mode: TimerMode, taskIds: string[], taskMode: TaskMode): Promise<boolean> => {
      setLoading(true)
      setError(null)
      
      try {
        // Get current date for consistent timing between client and server
        const startTime = new Date();
        
        // Create new pomodoro state locally first for immediate UI update
        const pomodoroState: PomodoroState = {
          active: true,
          type: mode,
          status: "active",
          startTime: startTime,
          remainingTime: getTimerDuration(mode, settings),
          taskMode,
          tasks: taskIds.map((id, index) => ({
            id,
            position: index,
            completed: false
          }))
        }
        
        // Save to session storage
        setSyncState(pomodoroState)
        
        // Save to API
        const response = await fetch('/api/pomodoro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: mode,
            status: 'active',
            startTime: startTime.toISOString(),
            taskMode,
            taskIds
          }),
        })
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const result = await response.json()
        
        // Update local state with the ID from server if successful
        if (result.success) {
          setSyncState(prev => ({
            ...prev,
            id: result.id
          }))
        }
        
        return true
      } catch (err) {
        console.error("Error starting pomodoro", err)
        setError("Failed to start Pomodoro session")
        return false
      } finally {
        setLoading(false)
      }
    },
    [settings, setSyncState]
  )
  
  /**
   * Stop or update pomodoro session
   */
  const stopPomodoro = useCallback(
    async (status: PomodoroStatus): Promise<boolean> => {
      setLoading(true)
      setError(null)
      
      try {
        // Use same endTime for both client and server for consistency
        const endTime = new Date();
        
        // Update local state immediately
        setSyncState(prev => ({
          ...prev,
          active: false,
          status,
          endTime: endTime
        }))
        
        // Update database
        const response = await fetch('/api/pomodoro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: syncState.type,
            status,
            endTime: endTime.toISOString(),
            taskMode: syncState.taskMode,
            taskIds: syncState.tasks.map(t => t.id)
          }),
        })
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        return true
      } catch (err) {
        console.error("Error stopping pomodoro", err)
        setError("Failed to stop Pomodoro session")
        return false
      } finally {
        setLoading(false)
      }
    },
    [syncState, setSyncState]
  )
  
  /**
   * Update the remaining time
   */
  const updateRemainingTime = useCallback(
    (remainingTime: number) => {
      setSyncState(prev => ({
        ...prev,
        remainingTime
      }))
      // Note: We don't sync remainingTime to the database on every update
      // as that would create too many requests
    },
    [setSyncState]
  )
  
  /**
   * Mark a task as completed in the queue
   */
  const completeTask = useCallback(
    async (taskId: string) => {
      // Update local state
      setSyncState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === taskId 
            ? { ...task, completed: true }
            : task
        )
      }))
      
      // TODO: Add API endpoint to mark a task as completed in the pomodoro
      // For now we'll just update the local state
    },
    [setSyncState]
  )
  
  /**
   * Check for updates from the server
   */
  const checkForUpdates = useCallback(() => {
    const fetchLatestFromAPI = async () => {
      try {
        // Only check for updates if there's an active pomodoro
        if (!syncState.active) return;
        
        const response = await fetch('/api/pomodoro')
        if (!response.ok) return;
        
        const data = await response.json()
        
        // If active status differs or there's a significant time difference, update local state
        if (data.active !== syncState.active || 
            Math.abs(data.remainingTime - syncState.remainingTime) > 5) {
          setSyncState(prev => ({
            ...prev,
            active: data.active,
            id: data.id || prev.id,
            type: data.type,
            taskMode: data.taskMode,
            remainingTime: data.remainingTime,
            startTime: data.startTime ? new Date(data.startTime) : prev.startTime,
            endTime: data.endTime ? new Date(data.endTime) : prev.endTime,
            status: data.status || prev.status,
            tasks: data.tasks || []
          }))
        }
      } catch (err) {
        console.error("Error checking for pomodoro updates from API", err)
      }
    }
    
    // For cross-tab sync, still check sessionStorage
    const storedState = window.sessionStorage.getItem("pomodoro-state")
    if (storedState) {
      try {
        const parsedState = JSON.parse(storedState)
        
        // Only update if there are meaningful differences to prevent loops
        const currentSyncJSON = JSON.stringify(syncState)
        const newSyncJSON = JSON.stringify(parsedState)
        
        if (currentSyncJSON !== newSyncJSON) {
          setSyncState(parsedState)
        }
      } catch (err) {
        console.error("Error checking for pomodoro updates from storage", err)
      }
    }
    
    // Check API infrequently to avoid too many requests
    fetchLatestFromAPI();
  }, [setSyncState, syncState])
  
  return {
    syncState,
    loading,
    error,
    startPomodoro,
    stopPomodoro,
    updateRemainingTime,
    completeTask,
    checkForUpdates
  }
}

/**
 * Helper to get duration in seconds based on settings
 */
function getTimerDuration(mode: TimerMode, settings: Record<string, any>): number {
  if (mode === "focus") {
    return Number(settings.pomodoroDuration || 25) * 60
  } else if (mode === "shortBreak") {
    return Number(settings.shortBreakDuration || 5) * 60
  } else { // longBreak
    return Number(settings.longBreakDuration || 15) * 60
  }
} 