import { useState, useEffect, useRef, useCallback } from "react"
import { useSettings } from "@/hooks/use-settings"
import { useNotifications } from "@/hooks/use-notifications"
import { startPomodoroTimer, stopPomodoroTimer, isMobileApp } from "@/lib/mobileBridge"
import { usePomodoroSync } from "@/hooks/usePomodoroSync"

type TimerMode = "focus" | "shortBreak" | "longBreak"
type TaskMode = "single" | "multi" | "free"

interface TimerConfig {
  focus: number;
  shortBreak: number;
  longBreak: number;
}

interface PomodoroHookReturn {
  mode: TimerMode;
  setMode: (mode: TimerMode) => void;
  timeLeft: number;
  isActive: boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
  pomodorosCompleted: number;
  
  // Task-related properties and methods
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  taskQueue: string[];
  setTaskQueue: (queue: string[]) => void;
  taskMode: TaskMode;
  setTaskMode: (mode: TaskMode) => void;
}

export function usePomodoroTimer(): PomodoroHookReturn {
  const { settings } = useSettings()
  const { sendNotification } = useNotifications()
  const { 
    syncState, 
    startPomodoro, 
    stopPomodoro, 
    checkForUpdates 
  } = usePomodoroSync()

  // Ensure we have valid numbers with fallbacks
  const getValidTimerConfig = (): TimerConfig => {
    return {
      focus: Number(settings.pomodoroDuration || 25) * 60,
      shortBreak: Number(settings.shortBreakDuration || 5) * 60,
      longBreak: Number(settings.longBreakDuration || 15) * 60,
    }
  }

  // Timer state
  const [mode, setMode] = useState<TimerMode>(syncState.type || "focus")
  const [timeLeft, setTimeLeft] = useState<number>(() => 
    syncState.remainingTime || getValidTimerConfig().focus
  )
  const [isActive, setIsActive] = useState<boolean>(syncState.active || false)
  const [pomodorosCompleted, setPomodorosCompleted] = useState<number>(0)
  
  // Task selection state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    syncState.taskMode === "single" && syncState.tasks.length > 0 
      ? syncState.tasks[0].id
      : null
  )
  const [taskQueue, setTaskQueue] = useState<string[]>(
    syncState.taskMode === "multi"
      ? syncState.tasks.map(t => t.id)
      : []
  )
  const [taskMode, setTaskMode] = useState<TaskMode>(
    (syncState.taskMode as TaskMode) || "single"
  )
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const halfwayNotificationSent = useRef<boolean>(false)

  // Effect to update local state when server state changes
  useEffect(() => {
    console.log('syncState', syncState);
    // Skip if syncState is not active - no need to sync
    if (!syncState.active) return;

    // Use a ref to track if we should update to avoid dependency cycles
    const syncChanges = () => {
      // Only update if there are actual changes to prevent loops
      const shouldUpdate = 
        syncState.active !== isActive ||
        syncState.type !== mode ||
        syncState.remainingTime !== timeLeft ||
        (syncState.taskMode === "single" && syncState.tasks[0]?.id !== selectedTaskId) ||
        (syncState.taskMode === "multi" && JSON.stringify(syncState.tasks.map(t => t.id)) !== JSON.stringify(taskQueue)) ||
        syncState.taskMode !== taskMode;
      
      if (shouldUpdate) {
        // Batch all state updates together to minimize re-renders
        const updates = () => {
          setMode(syncState.type);
          setTimeLeft(syncState.remainingTime || getValidTimerConfig()[syncState.type]);
          setIsActive(true);
          
          if (syncState.taskMode === "single" && syncState.tasks.length > 0) {
            setSelectedTaskId(syncState.tasks[0].id);
            setTaskQueue([]);
          } else if (syncState.taskMode === "multi") {
            setSelectedTaskId(null);
            setTaskQueue(syncState.tasks.map(t => t.id));
          } else {
            setSelectedTaskId(null);
            setTaskQueue([]);
          }
          
          setTaskMode(syncState.taskMode as TaskMode);
        };
        
        // Execute the updates
        updates();
      }
    };
    
    // Run the sync changes function
    syncChanges();
    
    // We only need to react to changes in syncState, not the local states
    // This prevents infinite update loops
  }, [syncState]);

  // Update timer mode and reset timer
  const updateMode = useCallback((newMode: TimerMode): void => {
    // If we're already active with a different mode, stop the current session
    if (isActive && mode !== newMode) {
      stopPomodoro("finished").then(() => {
        setMode(newMode)
        setTimeLeft(getValidTimerConfig()[newMode])
        setIsActive(false)
        halfwayNotificationSent.current = false
        
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      })
    } else {
      setMode(newMode)
      setTimeLeft(getValidTimerConfig()[newMode])
      setIsActive(false)
      halfwayNotificationSent.current = false
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isActive, mode, stopPomodoro, getValidTimerConfig])

  // Handle toggling timer state
  const toggleTimer = useCallback((): void => {
    // If not active and about to start, sync with server
    if (!isActive) {
      const taskIds = taskMode === "single" 
        ? (selectedTaskId ? [selectedTaskId] : [])
        : taskQueue;
      
      startPomodoro(mode, taskIds, taskMode).then(() => {
        setIsActive(true)
      })
    } 
    // If active and about to stop, update server
    else {
      stopPomodoro("finished").then(() => {
        setIsActive(false)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      })
    }
  }, [isActive, mode, selectedTaskId, taskQueue, taskMode, startPomodoro, stopPomodoro])

  // Effect to handle timer countdown
  useEffect((): () => void => {
    const currentTimerConfig = getValidTimerConfig();
    let checkUpdatesTimeout: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      if (isMobileApp() && !timerRef.current) {
        startPomodoroTimer({
          duration: currentTimerConfig[mode] / 60,
          mode: mode
        });
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev === Math.floor(currentTimerConfig[mode] / 2) && !halfwayNotificationSent.current) {
            halfwayNotificationSent.current = true;

            if (settings.notificationsEnabled && !isMobileApp()) {
              const minutesLeft: number = Math.floor(prev / 60);
              sendNotification(`${mode === "focus" ? "Pomodoro" : "Break"} Halfway Point`, {
                body: `${minutesLeft} minutes remaining in your ${mode === "focus" ? "focus session" : "break"}`,
                icon: "/favicon.ico",
              });
            }
          }

          // Check for updates less frequently and use a separate timeout
          if (prev % 15 === 0 && !checkUpdatesTimeout) {
            checkUpdatesTimeout = setTimeout(() => {
              checkForUpdates();
              checkUpdatesTimeout = null;
            }, 1000);
          }

          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false)

      if (isMobileApp()) {
        stopPomodoroTimer()
      }

      // Mark the session as finished on the server
      stopPomodoro("finished")

      if (settings.notificationsEnabled && !isMobileApp()) {
        if (mode === "focus") {
          sendNotification("Pomodoro Completed!", {
            body: "Great job! Time to take a break.",
            icon: "/favicon.ico",
          })
        } else {
          sendNotification("Break Completed!", {
            body: "Break time is over. Ready to focus again?",
            icon: "/favicon.ico",
          })
        }
      }

      if (mode === "focus") {
        setPomodorosCompleted((prev: number) => prev + 1)
        
        // If in multi-task mode, move to the next task
        if (taskMode === "multi" && taskQueue.length > 1) {
          const newQueue = [...taskQueue]
          newQueue.shift() // Remove the first task
          setTaskQueue(newQueue)
        }

        if ((pomodorosCompleted + 1) % 4 === 0) {
          updateMode("longBreak")
        } else {
          updateMode("shortBreak")
        }

        if (settings.soundEnabled && !isMobileApp()) {
          const audio = new Audio("/notification.mp3")
          audio.play().catch((e: Error) => console.error("Error playing sound:", e))
        }
      } else {
        updateMode("focus")
      }
    }

    return (): void => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (checkUpdatesTimeout) {
        clearTimeout(checkUpdatesTimeout)
      }
      if (isMobileApp() && isActive) {
        stopPomodoroTimer()
      }
    }
  }, [
    isActive, 
    timeLeft, 
    mode, 
    pomodorosCompleted, 
    settings, 
    sendNotification, 
    taskMode, 
    taskQueue, 
    updateMode, 
    stopPomodoro,
    checkForUpdates
  ])

  return {
    mode,
    setMode: updateMode,
    timeLeft,
    isActive,
    toggleTimer,
    resetTimer: (): void => {
      if (isActive) {
        stopPomodoro("cancelled").then(() => {
          const currentTimerConfig = getValidTimerConfig()
          setIsActive(false)
          setTimeLeft(currentTimerConfig[mode])
          halfwayNotificationSent.current = false

          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }

          if (isMobileApp()) {
            stopPomodoroTimer()
          }
        })
      } else {
        const currentTimerConfig = getValidTimerConfig()
        setTimeLeft(currentTimerConfig[mode])
        halfwayNotificationSent.current = false
      }
    },
    pomodorosCompleted,
    selectedTaskId,
    setSelectedTaskId,
    taskQueue,
    setTaskQueue,
    taskMode,
    setTaskMode
  }
}

