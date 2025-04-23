"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronUpIcon, ChevronDownIcon, XIcon, PlayIcon, ListIcon, ChevronsRightIcon, TimerIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTasks } from "@/hooks/use-tasks"

export interface TaskSelectionProps {
  taskQueue: string[]
  onTaskQueueChange: (queue: string[]) => void
}

export function TaskSelection({
  taskQueue,
  onTaskQueueChange,
}: TaskSelectionProps) {
  const { tasks } = useTasks()
  
  // Toggle task selection in queue
  const handleTaskToggle = (taskId: string) => {
    if (taskQueue.includes(taskId)) {
      onTaskQueueChange(taskQueue.filter(id => id !== taskId))
    } else {
      onTaskQueueChange([...taskQueue, taskId])
    }
  }

  // Move task up or down in queue
  const moveTaskInQueue = (taskId: string, direction: "up" | "down") => {
    const currentIndex = taskQueue.indexOf(taskId)
    if (currentIndex === -1) return
    
    const newQueue = [...taskQueue]
    
    if (direction === "up" && currentIndex > 0) {
      // Swap with previous item
      [newQueue[currentIndex], newQueue[currentIndex - 1]] = [newQueue[currentIndex - 1], newQueue[currentIndex]]
    } else if (direction === "down" && currentIndex < taskQueue.length - 1) {
      // Swap with next item
      [newQueue[currentIndex], newQueue[currentIndex + 1]] = [newQueue[currentIndex + 1], newQueue[currentIndex]]
    }
    
    onTaskQueueChange(newQueue)
  }
  
  // Remove task from queue
  const removeFromQueue = (taskId: string) => {
    onTaskQueueChange(taskQueue.filter(id => id !== taskId))
  }
  
  // Get total estimated time for tasks in queue
  const getTotalEstimatedTime = () => {
    return taskQueue.reduce((total, taskId) => {
      const task = tasks.find(t => t.id === taskId)
      return total + (task?.estimatedPomodoros || 1)
    }, 0)
  }
  
  // Format time as hours and minutes
  const formatEstimatedTime = (pomodoros: number) => {
    // Assuming 1 pomodoro = 25 minutes
    const totalMinutes = pomodoros * 25
    if (totalMinutes < 60) {
      return `${totalMinutes}m`
    }
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListIcon className="h-5 w-5" />
          Task Selection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm font-medium mb-2">
          Add or remove tasks from your queue:
        </div>
        <ScrollArea className="h-52 rounded-md border p-2 mb-4">
          <div className="space-y-2 pr-3">
            {tasks.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No uncompleted tasks found
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-2 rounded-md cursor-pointer flex items-center justify-between ${
                    taskQueue.includes(task.id)
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => handleTaskToggle(task.id)}
                >
                  <div className="max-w-[80%]">
                    <div className="text-sm font-medium truncate">{task.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <TimerIcon className="h-3 w-3" />
                      {task.estimatedPomodoros || 1} pomodoro{task.estimatedPomodoros !== 1 ? "s" : ""}
                    </div>
                  </div>
                  {task.priority && (
                    <Badge 
                      variant={
                        task.priority === "high" 
                          ? "destructive" 
                          : task.priority === "medium" 
                          ? "default" 
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
            
            {/* Task Queue */}
            {taskQueue.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm font-medium mb-2">
              <span>Task Queue:</span>
              <span className="text-xs text-muted-foreground">
                Est. time: {formatEstimatedTime(getTotalEstimatedTime())}
              </span>
            </div>
            <div className="space-y-2 border rounded-md p-2">
              {taskQueue.map((taskId, index) => {
                const task = tasks.find(t => t.id === taskId)
                if (!task) return null
                return (
                  <div key={taskId} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="text-muted-foreground text-xs font-medium w-5 text-center">
                        {index + 1}
                      </div>
                      <div className="text-sm">{task.title}</div>
                    </div>
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveTaskInQueue(taskId, "up")
                        }}
                        disabled={index === 0}
                      >
                        <ChevronUpIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveTaskInQueue(taskId, "down")
                        }}
                        disabled={index === taskQueue.length - 1}
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromQueue(taskId)
                        }}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 