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

interface PomodoroState {
  type: TimerMode;
  active: boolean;
  startTime: string | null;
  tasks: { id: string }[];
  taskMode: TaskMode;
  completedPomodoros?: number;
}

interface PomodoroHookReturn {
  mode: TimerMode;
  setMode: (mode: TimerMode) => void;
  timeLeft: number;
  timeLapsed: number;
  isActive: boolean;
  isShown: boolean;
  setIsShown: (isShown: boolean) => void;
  toggleTimer: () => void;
  startFocus: (taskId: string) => void;
  startRelax: () => void;
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

// --- Pomodoro Session Cycle Constants ---
const FOCUS_CYCLE_LENGTH = 3; // Number of focus sessions before long break

export function usePomodoroTimer(): PomodoroHookReturn & {
  showRelax: boolean;
  showResume: boolean;
  showLongBreak: boolean;
  startLongBreak: () => void;
  resumeFocus: () => void;
} {
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
  // Track number of focus sessions completed in the current cycle
// Use completedPomodoros from syncState if available
const [pomodorosCompleted, setPomodorosCompleted] = useState<number>(syncState.completedPomodoros ?? 0)
const [focusSessionsInCycle, setFocusSessionsInCycle] = useState<number>(0)
const [lastFinishedMode, setLastFinishedMode] = useState<TimerMode | null>(null)
  // Always calculate timeLeft from syncState
  const getTimeLeft = () => {
    if (!syncState.active || !syncState.startTime) {
      const time = getValidTimerConfig()[syncState.type || "focus"]
      return time
    };
    const now = Date.now();
    const start = new Date(syncState.startTime).getTime();
    const duration = getValidTimerConfig()[syncState.type];
    return Math.max(0, duration - Math.floor((now - start) / 1000));
  };

  const getTimeLapsed = () => {
    if (!syncState.active || !syncState.startTime) return 0;
    const now = Date.now();
    const start = new Date(syncState.startTime).getTime();
    return Math.max(0, Math.floor((now - start) / 1000));
  };


  const [timeLeft, setTimeLeft] = useState<number>(getTimeLeft());
  const [timeLapsed, setTimeLapsed] = useState<number>(0);
  
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
    setTimeLapsed(getTimeLapsed());
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

  // Effect: handle timer completion and session transitions
  useEffect(() => {
    // Update completedPomodoros from syncState if available
    if (typeof syncState.completedPomodoros === 'number') {
      setPomodorosCompleted(syncState.completedPomodoros);
    }
    if (timeLeft === 0 && isActive) {
      // Timer just finished
      if (mode === "focus") {
        setFocusSessionsInCycle((prev) => prev + 1);
        setLastFinishedMode("focus");
        setIsActive(false);
      } else if (mode === "shortBreak") {
        setLastFinishedMode("shortBreak");
        setIsActive(false);
      } else if (mode === "longBreak") {
        setLastFinishedMode("longBreak");
        setIsActive(false);
        setFocusSessionsInCycle(0); // Reset cycle after long break
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isActive, mode, syncState.completedPomodoros]);

  // Update timer mode and reset timer
  const updateMode = useCallback((newMode: TimerMode): void => {
    // If we're already active with a different mode, stop the current session
    if (isActive && mode !== newMode) {
      stopPomodoro(timeLeft > 0 ? "cancelled" : "finished").then(() => {
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
  const toggleTimer = useCallback(async (): Promise<void> => {
    // If not active and about to start, sync with server
    if (!isActive) {
      const taskIds = taskMode === "single" 
        ? (selectedTaskId ? [selectedTaskId] : [])
        : taskQueue;
      
      await startPomodoro(mode, taskIds, taskMode).then(() => {
        setIsActive(true)
      })
    } 
    // If active and about to stop, update server
    else {
      await stopPomodoro(timeLeft > 0 ? "cancelled" : "finished").then(() => {
        setIsActive(false)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      })
    }
  }, [isActive, mode, selectedTaskId, taskQueue, taskMode, startPomodoro, stopPomodoro])

  const startFocus = useCallback((taskId: string) => {
    if (!isActive) {
      setSelectedTaskId(taskId)
      setTaskMode("single")
    }
    setIsShown(true);
  }, [setIsShown, setSelectedTaskId, setTaskMode])

  const startRelax = useCallback(async () => {
  // Only allow if just finished a focus session
  if (lastFinishedMode === "focus") {
    setMode("shortBreak");
    setTimeLeft(getValidTimerConfig()["shortBreak"]);
    setIsActive(true);
    setLastFinishedMode(null);
    await startPomodoro("shortBreak", [], taskMode);
  }
}, [lastFinishedMode, setMode, setTimeLeft, setIsActive, setLastFinishedMode, startPomodoro, taskMode, getValidTimerConfig]);

  // Effect to update timeLeft every second if active
  useEffect(() => {
    // Always update timeLapsed if we have a startTime
    if (!syncState.startTime) return;
    // Only update timeLeft if active
    setTimeLeft(getTimeLeft());
    setTimeLapsed(getTimeLapsed());
    const interval = setInterval(() => {
      if (isActive) {
        setTimeLeft(getTimeLeft());
      }
      setTimeLapsed(getTimeLapsed());
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, syncState.startTime, syncState.type, settings]);

// --- New: Long Break and Resume logic ---
  const startLongBreak = useCallback(async () => {
    if (lastFinishedMode === "focus" && focusSessionsInCycle >= FOCUS_CYCLE_LENGTH) {
      setMode("longBreak");
      setTimeLeft(getValidTimerConfig()["longBreak"]);
      setIsActive(true);
      setLastFinishedMode(null);
      setFocusSessionsInCycle(0);
      await startPomodoro("longBreak", [], taskMode);
    }
  }, [lastFinishedMode, focusSessionsInCycle, setMode, setTimeLeft, setIsActive, setLastFinishedMode, setFocusSessionsInCycle, startPomodoro, taskMode, getValidTimerConfig]);

  const resumeFocus = useCallback(async () => {
    if ((lastFinishedMode === "shortBreak" || lastFinishedMode === "longBreak") || (lastFinishedMode === "focus" && focusSessionsInCycle < FOCUS_CYCLE_LENGTH)) {
      setMode("focus");
      setTimeLeft(getValidTimerConfig()["focus"]);
      setIsActive(true);
      setLastFinishedMode(null);
      await startPomodoro("focus", selectedTaskId ? [selectedTaskId] : [], taskMode);
    }
  }, [lastFinishedMode, focusSessionsInCycle, setMode, setTimeLeft, setIsActive, setLastFinishedMode, startPomodoro, selectedTaskId, taskMode, getValidTimerConfig]);

  // --- Button Visibility Logic ---
  const showRelax = !isActive && timeLeft === 0 && lastFinishedMode === "focus" && focusSessionsInCycle < FOCUS_CYCLE_LENGTH;
  // Only show Resume after a break (shortBreak or longBreak) is finished
  const showResume = !isActive && timeLeft === 0 && (lastFinishedMode === "shortBreak" || lastFinishedMode === "longBreak");
  const showLongBreak = !isActive && timeLeft === 0 && lastFinishedMode === "focus" && focusSessionsInCycle >= FOCUS_CYCLE_LENGTH;

  return {
    mode,
    setMode: updateMode,
    timeLeft,
    timeLapsed,
    isActive,
    toggleTimer,
    startFocus,
    startRelax,
    resetTimer: (): void => {
      if (isActive) {
        stopPomodoro("cancelled").then(() => {
          const currentTimerConfig = getValidTimerConfig()
          setIsActive(false)
          setTimeLeft(currentTimerConfig[mode])
          setTimeLapsed(0)
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
    // --- New additions for UI ---
    showRelax,
    showResume,
    showLongBreak,
    startLongBreak,
    resumeFocus,
  }
}

