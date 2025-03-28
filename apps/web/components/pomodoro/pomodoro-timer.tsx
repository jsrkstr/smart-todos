"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Toggle } from "@/components/ui/toggle"
import { CircleProgress } from "@/components/ui/circle-progress"
import { usePomodoroTimer } from "@/hooks/usePomodoroTimer"
import { useTasks } from "@/hooks/useTasks"
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

export function PomodoroTimer() {
  const {
    mode,
    setMode,
    timeLeft,
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
  } = usePomodoroTimer()
  
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
    if (isNaN(seconds)) return "25:00" // Fallback if value is NaN
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getProgress = (): number => {
    const config = {
      focus: Number(settings.pomodoroDuration || 25) * 60,
      shortBreak: Number(settings.shortBreakDuration || 5) * 60,
      longBreak: Number(settings.longBreakDuration || 15) * 60
    }
    
    if (timeLeft <= 0) return 100
    return 100 - (timeLeft / config[mode]) * 100
  }

  return (
    <div className="flex flex-col gap-4 p-4 w-full">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Pomodoro Timer
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select 
                value={mode} 
                onValueChange={(value) => setMode(value as "focus" | "shortBreak" | "longBreak")}
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="focus">Focus</SelectItem>
                  <SelectItem value="shortBreak">Short Break</SelectItem>
                  <SelectItem value="longBreak">Long Break</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription>
            Timer to help you focus and take breaks
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center">
            <div 
              className="relative w-48 h-48 flex items-center justify-center rounded-full"
            >
              <CircleProgress 
                value={getProgress()} 
                size={192} 
                strokeWidth={8} 
              />
              <div className="absolute text-4xl font-semibold">
                {formatTime(timeLeft)}
              </div>
            </div>
            
            <div className="mt-8 flex space-x-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleTimer}
              >
                {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={resetTimer}
              >
                <Square className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  updateSettings({
                    ...settings,
                    soundEnabled: !settings.soundEnabled,
                  })
                }}
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Show task info when in focus mode */}
          {mode === "focus" && activeTask && (
            <div className="w-full mt-4 p-4 bg-muted rounded-lg">
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
          <div className="w-full mt-2 flex items-center justify-between text-sm">
            <span>Pomodoros completed:</span>
            <span className="font-medium">{pomodorosCompleted}</span>
          </div>
        </CardContent>
      </Card>

      {/* Task Selection Component */}
      <TaskSelection 
        selectedTaskId={selectedTaskId}
        onTaskSelected={setSelectedTaskId}
        taskQueue={taskQueue}
        onTaskQueueChange={setTaskQueue}
        taskMode={taskMode}
        onTaskModeChange={setTaskMode}
      />
    </div>
  )
}

