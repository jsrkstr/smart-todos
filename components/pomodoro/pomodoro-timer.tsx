"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, CheckCircle2, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTasks } from "@/hooks/use-tasks"
import { useSettings } from "@/hooks/use-settings"
import { useNotifications } from "@/hooks/use-notifications"

type TimerMode = "focus" | "shortBreak" | "longBreak"

export function PomodoroTimer() {
  const { settings } = useSettings()
  const { sendNotification } = useNotifications()

  // Get timer durations from settings
  const TIMER_CONFIG = {
    focus: Number.parseInt(settings.pomodoroDuration) * 60, // minutes to seconds
    shortBreak: Number.parseInt(settings.shortBreakDuration) * 60,
    longBreak: Number.parseInt(settings.longBreakDuration) * 60,
  }

  const [mode, setMode] = useState<TimerMode>("focus")
  const [timeLeft, setTimeLeft] = useState(TIMER_CONFIG[mode])
  const [isActive, setIsActive] = useState(false)
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const halfwayNotificationSent = useRef(false)
  const { tasks } = useTasks()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Reset timer when mode changes
  useEffect(() => {
    setTimeLeft(TIMER_CONFIG[mode])
    setIsActive(false)
    halfwayNotificationSent.current = false

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [mode])

  // Timer logic
  useEffect(() => {
    const currentTimerConfig = {
      focus: Number.parseInt(settings.pomodoroDuration) * 60, // minutes to seconds
      shortBreak: Number.parseInt(settings.shortBreakDuration) * 60,
      longBreak: Number.parseInt(settings.longBreakDuration) * 60,
    }

    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          // Check if we're at halfway point
          if (prev === Math.floor(currentTimerConfig[mode] / 2) && !halfwayNotificationSent.current) {
            halfwayNotificationSent.current = true

            if (settings.notificationsEnabled) {
              const minutesLeft = Math.floor(prev / 60)
              sendNotification(`${mode === "focus" ? "Pomodoro" : "Break"} Halfway Point`, {
                body: `${minutesLeft} minutes remaining in your ${mode === "focus" ? "focus session" : "break"}`,
                icon: "/favicon.ico",
              })
            }
          }

          return prev - 1
        })
      }, 1000)
    } else if (isActive && timeLeft === 0) {
      // Timer completed
      setIsActive(false)

      if (settings.notificationsEnabled) {
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
        setPomodorosCompleted((prev) => prev + 1)

        // After 4 pomodoros, take a long break
        if ((pomodorosCompleted + 1) % 4 === 0) {
          setMode("longBreak")
        } else {
          setMode("shortBreak")
        }

        // Play notification sound if enabled
        if (settings.soundEnabled) {
          const audio = new Audio("/notification.mp3")
          audio.play().catch((e) => console.error("Error playing sound:", e))
        }
      } else {
        // Break completed, back to focus
        setMode("focus")
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isActive, timeLeft, mode, pomodorosCompleted, settings, sendNotification])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    const currentTimerConfig = {
      focus: Number.parseInt(settings.pomodoroDuration) * 60, // minutes to seconds
      shortBreak: Number.parseInt(settings.shortBreakDuration) * 60,
      longBreak: Number.parseInt(settings.longBreakDuration) * 60,
    }
    const total = currentTimerConfig[mode]
    return ((total - timeLeft) / total) * 100
  }

  // Toggle timer
  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  // Reset timer
  const resetTimer = () => {
    const currentTimerConfig = {
      focus: Number.parseInt(settings.pomodoroDuration) * 60, // minutes to seconds
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
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Pomodoro Timer</CardTitle>
          <CardDescription>Use the Pomodoro Technique to boost your productivity</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Tabs
            defaultValue="focus"
            value={mode}
            onValueChange={(value) => setMode(value as TimerMode)}
            className="w-full max-w-md mb-6"
          >
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="focus">Focus</TabsTrigger>
              <TabsTrigger value="shortBreak">Short Break</TabsTrigger>
              <TabsTrigger value="longBreak">Long Break</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="w-full max-w-md mb-8">
            <div className="relative flex items-center justify-center mb-4">
              <div className="text-6xl font-bold tabular-nums">{formatTime(timeLeft)}</div>
              {mode === "focus" ? (
                <CheckCircle2 className="absolute right-0 h-8 w-8 text-primary" />
              ) : (
                <Coffee className="absolute right-0 h-8 w-8 text-primary" />
              )}
            </div>

            <Progress value={calculateProgress()} className="h-2 mb-4" />

            <div className="flex justify-center gap-4">
              <Button size="lg" onClick={toggleTimer} className="w-32">
                {isActive ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </>
                )}
              </Button>

              <Button variant="outline" size="lg" onClick={resetTimer} className="w-32">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Pomodoros completed today: <span className="font-medium">{pomodorosCompleted}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select a Task</CardTitle>
          <CardDescription>Choose a task to focus on during your Pomodoro session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks.filter((task) => !task.completed).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No tasks available. Add a task to get started!</p>
            ) : (
              tasks
                .filter((task) => !task.completed)
                .map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedTaskId === task.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <p className="font-medium">{task.title}</p>
                    {task.subTasks && task.subTasks.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.subTasks.filter((st) => st.completed).length}/{task.subTasks.length} subtasks completed
                      </p>
                    )}
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pomodoro Technique</CardTitle>
          <CardDescription>How to use the Pomodoro Technique effectively</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside text-sm">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Choose a task</span> - Select a task you want to work on
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Set the timer</span> - Work for {settings.pomodoroDuration}{" "}
              minutes (one Pomodoro)
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Focus</span> - Work on the task until the timer rings
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Take a break</span> - Take a short{" "}
              {settings.shortBreakDuration}-minute break
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Repeat</span> - After 4 Pomodoros, take a longer{" "}
              {settings.longBreakDuration}-minute break
            </li>
          </ol>

          <div className="mt-6 p-3 bg-primary/10 rounded-md">
            <p className="text-sm font-medium">Benefits:</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Improves focus and concentration</li>
              <li>Reduces mental fatigue</li>
              <li>Increases accountability</li>
              <li>Helps manage distractions</li>
              <li>Creates a sense of accomplishment</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

