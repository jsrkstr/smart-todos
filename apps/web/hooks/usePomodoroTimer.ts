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
  isShown: boolean;
  setIsShown: (isShown: boolean) => void;
  toggleTimer: () => void;
  startTimer: (taskId: string) => void;
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
  const [isShown, setIsShown] = useState<boolean>(false);
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
  const [isActive, setIsActive] = useState<boolean>(syncState.active || false)
  const [pomodorosCompleted, setPomodorosCompleted] = useState<number>(0)
  // Always calculate timeLeft from syncState
  const getTimeLeft = () => {
    if (!syncState.active || !syncState.startTime) return getValidTimerConfig()[syncState.type || "focus"];
    const now = Date.now();
    const start = new Date(syncState.startTime).getTime();
    const duration = getValidTimerConfig()[syncState.type];
    return Math.max(0, duration - Math.floor((now - start) / 1000));
  };
  const [timeLeft, setTimeLeft] = useState<number>(getTimeLeft());
  
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

  // Effect: update all state from syncState
  useEffect(() => {
    setMode(syncState.type || "focus");
    setIsActive(syncState.active || false);
    setTimeLeft(getTimeLeft());
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

  const startTimer = useCallback((taskId: string) => {
    if (!isActive) {
      setSelectedTaskId(taskId)
      setTaskMode("single")
    }
    setIsShown(true);
  }, [toggleTimer, setIsShown])

  // Effect to update timeLeft every second if active
  useEffect(() => {
    if (!isActive) return;
    setTimeLeft(getTimeLeft()); // Ensure immediate sync on activation
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, syncState.startTime, syncState.type, settings]);

  return {
    mode,
    setMode: updateMode,
    timeLeft,
    isActive,
    toggleTimer,
    startTimer,
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
    setTaskMode,
    isShown,
    setIsShown,
  }
}

