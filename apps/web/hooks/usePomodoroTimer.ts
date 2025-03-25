import { useState, useEffect, useRef } from "react"
import { useSettings } from "@/hooks/use-settings"
import { useNotifications } from "@/hooks/use-notifications"
import { startPomodoroTimer, stopPomodoroTimer, isMobileApp } from "@/lib/mobileBridge"

type TimerMode = "focus" | "shortBreak" | "longBreak"

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
}

export function usePomodoroTimer(): PomodoroHookReturn {
  const { settings } = useSettings()
  const { sendNotification } = useNotifications()

  const TIMER_CONFIG: TimerConfig = {
    focus: Number.parseInt(settings.pomodoroDuration) * 60,
    shortBreak: Number.parseInt(settings.shortBreakDuration) * 60,
    longBreak: Number.parseInt(settings.longBreakDuration) * 60,
  }

  const [mode, setMode] = useState<TimerMode>("focus")
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_CONFIG[mode])
  const [isActive, setIsActive] = useState<boolean>(false)
  const [pomodorosCompleted, setPomodorosCompleted] = useState<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const halfwayNotificationSent = useRef<boolean>(false)

  useEffect((): void => {
    setTimeLeft(TIMER_CONFIG[mode])
    setIsActive(false)
    halfwayNotificationSent.current = false

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [mode])

  useEffect((): () => void => {
    const currentTimerConfig: TimerConfig = {
      focus: Number.parseInt(settings.pomodoroDuration) * 60,
      shortBreak: Number.parseInt(settings.shortBreakDuration) * 60,
      longBreak: Number.parseInt(settings.longBreakDuration) * 60,
    }

    if (isActive && timeLeft > 0) {
      if (isMobileApp() && !timerRef.current) {
        startPomodoroTimer({
          duration: currentTimerConfig[mode] / 60,
          mode: mode
        })
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev === Math.floor(currentTimerConfig[mode] / 2) && !halfwayNotificationSent.current) {
            halfwayNotificationSent.current = true

            if (settings.notificationsEnabled && !isMobileApp()) {
              const minutesLeft: number = Math.floor(prev / 60)
              sendNotification(`${mode === "focus" ? "Pomodoro" : "Break"} Halfway Point`, {
                body: `${minutesLeft} minutes remaining in your ${mode === "focus" ? "focus session" : "break"}`,
                icon: "/favicon.ico",
              })
            }
          }

          return prev - 1
        })
      }, 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)

      if (isMobileApp()) {
        stopPomodoroTimer()
      }

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

        if ((pomodorosCompleted + 1) % 4 === 0) {
          setMode("longBreak")
        } else {
          setMode("shortBreak")
        }

        if (settings.soundEnabled && !isMobileApp()) {
          const audio = new Audio("/notification.mp3")
          audio.play().catch((e: Error) => console.error("Error playing sound:", e))
        }
      } else {
        setMode("focus")
      }
    }

    return (): void => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (isMobileApp() && isActive) {
        stopPomodoroTimer()
      }
    }
  }, [isActive, timeLeft, mode, pomodorosCompleted, settings, sendNotification])

  return {
    mode,
    setMode,
    timeLeft,
    isActive,
    toggleTimer: (): void => setIsActive(!isActive),
    resetTimer: (): void => {
      const currentTimerConfig: TimerConfig = {
        focus: Number.parseInt(settings.pomodoroDuration) * 60,
        shortBreak: Number.parseInt(settings.shortBreakDuration) * 60,
        longBreak: Number.parseInt(settings.longBreakDuration) * 60,
      }
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
    },
    pomodorosCompleted,
  }
}
