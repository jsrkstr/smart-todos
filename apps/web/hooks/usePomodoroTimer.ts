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
  isTimeUp: boolean;
  setIsShown: (isShown: boolean) => void;
  start: () => void;
  stop: () => void;
  startFocus: (taskId: string) => void;
  startRelax: () => void;
  pomodorosCompleted: number;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  taskQueue: string[];
  setTaskQueue: (queue: string[]) => void;
  taskMode: TaskMode;
  setTaskMode: (mode: TaskMode) => void;
  nextMode: TimerMode | null;
  startLongBreak: () => void;
  resumeFocus: () => void;
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
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false)
  // Track number of focus sessions completed in the current cycle
// Use completedPomodoros from syncState if available
const [pomodorosCompleted, setPomodorosCompleted] = useState<number>(syncState.completedPomodoros ?? 0)
const [focusSessionsInCycle, setFocusSessionsInCycle] = useState<number>(0)
const [lastFinishedMode, setLastFinishedMode] = useState<TimerMode | null>(syncState.lastMode)
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
    setPomodorosCompleted(syncState.completedPomodoros);
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
    setLastFinishedMode(syncState.lastMode || null);

  }, [syncState]);

  // Effect: handle timer completion and session transitions
  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      setIsTimeUp(true)
    } 
    setIsTimeUp(timeLeft === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isActive, mode]);

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

  // Start the timer
  const start = useCallback(async (): Promise<void> => {
    if (!isActive) {
      const taskIds = taskMode === "single" 
        ? (selectedTaskId ? [selectedTaskId] : [])
        : taskQueue;
      await startPomodoro(mode, taskIds, taskMode).then(() => {
        setIsActive(true)
      })
    }
  }, [isActive, mode, selectedTaskId, taskQueue, taskMode, startPomodoro]);

  // Stop the timer
  const stop = useCallback(async (): Promise<void> => {
      await stopPomodoro(timeLeft > 0 ? "cancelled" : "finished").then(() => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      })
  }, [stopPomodoro, timeLeft]);

  const startFocus = useCallback((taskId: string) => {
    if (!isActive) {
      setSelectedTaskId(taskId)
      setTaskMode("single")
    }
    setIsShown(true);
  }, [setIsShown, setSelectedTaskId, setTaskMode])

  const startRelax = useCallback(async () => {
    setMode("shortBreak");
    setTimeLeft(getValidTimerConfig()["shortBreak"]);
    setIsActive(true);
    await startPomodoro("shortBreak", [], taskMode);
  }, [setMode, setTimeLeft, setIsActive, startPomodoro, taskMode, getValidTimerConfig]);

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

  const startLongBreak = useCallback(async () => {
      setMode("longBreak");
      setTimeLeft(getValidTimerConfig()["longBreak"]);
      setIsActive(true);
      await startPomodoro("longBreak", [], taskMode);
  }, [focusSessionsInCycle, setMode, setTimeLeft, setIsActive, startPomodoro, taskMode, getValidTimerConfig]);

  const resumeFocus = useCallback(async () => {
      setMode("focus");
      setTimeLeft(getValidTimerConfig()["focus"]);
      setIsActive(true);
      await startPomodoro("focus", selectedTaskId ? [selectedTaskId] : [], taskMode);
  }, [focusSessionsInCycle, setMode, setTimeLeft, setIsActive, startPomodoro, selectedTaskId, taskMode, getValidTimerConfig]);

  let nextMode: TimerMode | null = null;
  if (!isActive) {
    nextMode = 'focus';
  } else if (isActive && isTimeUp && lastFinishedMode === 'focus') {
    nextMode = (syncState.completedPomodoros + 1) % 3 === 0 ? 'longBreak' : 'shortBreak';
  }

  return {
    mode,
    setMode: updateMode,
    timeLeft,
    timeLapsed,
    isActive,
    isTimeUp,
    start,
    stop,
    startFocus,
    startRelax,
    pomodorosCompleted,
    selectedTaskId,
    setSelectedTaskId,
    taskQueue,
    setTaskQueue,
    taskMode,
    setTaskMode,
    isShown,
    setIsShown,
    nextMode,
    startLongBreak,
    resumeFocus,
  }
}

