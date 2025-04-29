"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CircleProgress } from "@/components/ui/circle-progress"
import { TaskSelection } from "@/components/pomodoro/task-selection"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Volume2, VolumeX, Pause, Play, Square, Timer } from "lucide-react"
import { useSettings } from "@/hooks/use-settings"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTasks } from "@/hooks/use-tasks"
import { useTimer } from "./pomodoro-context"

export function PomodoroTimer() {
  const {
    mode,
    setMode,
    timeLeft,
    timeLapsed,
    isActive,
    toggleTimer,
    resetTimer,
    pomodorosCompleted,
    selectedTaskId,
    setSelectedTaskId,
    taskQueue,
    setTaskQueue,
    taskMode,
    setTaskMode
  } = useTimer()

  // Sync selectedTaskId from localStorage (for PomodoroDialog integration)
  useEffect(() => {
    const storedTaskId = typeof window !== 'undefined' ? localStorage.getItem("pomodoroSelectedTaskId") : null;
    if (storedTaskId) {
      setSelectedTaskId(storedTaskId);
      localStorage.removeItem("pomodoroSelectedTaskId");
    }
  }, [setSelectedTaskId]);

  const { settings, updateSettings } = useSettings()
  const { tasks } = useTasks()
  const isMobile = useMediaQuery("(max-width: 640px)")

  // Active task based on mode
  const activeTask = taskMode === "single"
    ? tasks.find(t => t.id === selectedTaskId)
    : taskMode === "multi" && taskQueue.length > 0
      ? tasks.find(t => t.id === taskQueue[0])
      : null

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) seconds = 0; // Prevent negative display
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Total duration for current mode
  const config = {
    focus: Number(settings.pomodoroDuration || 25) * 60,
    shortBreak: Number(settings.shortBreakDuration || 5) * 60,
    longBreak: Number(settings.longBreakDuration || 15) * 60
  }
  const totalDuration = config[mode];

  // Status text based on mode
  const statusText = mode === 'focus' ? (isActive ? 'Working...' : '') : mode === 'shortBreak' ? 'Relaxing...' : 'Long Break';

  const getProgress = (): number => {
    if (timeLeft <= 0) return 100
    return 100 - (timeLeft / totalDuration) * 100
  }

  return (
    <div className="w-fulll mmin-w-[30vh]">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          Pomodoro Timer
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div
          className="relative w-48 h-48 flex items-center justify-center rounded-full"
        >
          {/* Elapsed time at the top */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 text-lg font-medium text-muted-foreground">
            {formatTime(timeLapsed)}
          </div>
          <CircleProgress
            value={getProgress()}
            size={192}
            strokeWidth={8}
          />
          {/* Time remaining in the center */}
          <div className="absolute text-4xl font-semibold">
            {formatTime(timeLeft)}
          </div>
          {/* Status below the timer */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-base font-normal text-muted-foreground">
            {statusText}
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <Button
            variant="outline"
            onClick={toggleTimer}
            className="px-10 rounded-3xl"
          >
            {isActive ? 'Stop' : 'Start'}
          </Button>
        </div>
      </div>

      {/* Show task info when in focus mode */}
      {mode === "focus" && activeTask && (
        <div className="w-full mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-1">Working on:</h3>
          <div className="flex items-center justify-between">
            <span className="line-clamp-1">{activeTask.title}</span>
            {taskMode === "multi" && taskQueue.length > 1 && (
              <span className="text-xs text-muted-foreground">
                +{taskQueue.length - 1} more tasks queued
              </span>
            )}
          </div>
        </div>
      )}

      {/* Pomodoros completed */}
      <div className="w-full mt-2 flex items-center justify-center text-sm">
        <span>Completed:</span>
        <span className="font-medium">{pomodorosCompleted}</span>
      </div>
    </div>
  )
}

