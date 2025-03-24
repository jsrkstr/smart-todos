"use client"

import { useState } from "react"
import { Calendar, CheckCircle, ChevronDown, ChevronUp, MapPin, MoreHorizontal, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { Task } from "@/types/task"
import { useTasks } from "@/hooks/use-tasks"

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const { toggleTaskCompletion, deleteTask } = useTasks()
  const [expanded, setExpanded] = useState(false)

  const subTasksCompleted = task.subTasks?.filter((st) => st.completed).length || 0
  const subTasksTotal = task.subTasks?.length || 0
  const subTaskProgress = subTasksTotal > 0 ? Math.round((subTasksCompleted / subTasksTotal) * 100) : 0

  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm transition-all",
        task.completed && "opacity-70",
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox checked={task.completed} onCheckedChange={() => toggleTaskCompletion(task.id)} className="mt-1" />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn("font-medium text-lg", task.completed && "line-through text-muted-foreground")}>
                {task.title}
              </h3>

              <div className="flex items-center gap-1 shrink-0">
                {task.priority === "high" && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Postpone</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteTask(task.id)}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {task.deadline && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  <span>{new Date(task.deadline).toLocaleDateString()}</span>
                </div>
              )}

              {task.location && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span>{task.location}</span>
                </div>
              )}

              {task.subTasks && task.subTasks.length > 0 && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  <span>
                    {subTasksCompleted}/{subTasksTotal} subtasks
                  </span>
                </div>
              )}
            </div>

            {task.why && (
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Why:</strong> {task.why}
              </p>
            )}
          </div>
        </div>

        {task.subTasks && task.subTasks.length > 0 && (
          <div className="mt-3 pl-8">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Subtasks ({subTasksCompleted}/{subTasksTotal})
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="sr-only">{expanded ? "Collapse" : "Expand"}</span>
              </Button>
            </div>

            <Progress value={subTaskProgress} className="h-2 mt-1" />

            {expanded && (
              <div className="mt-2 space-y-1">
                {task.subTasks.map((subTask, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Checkbox checked={subTask.completed} className="mt-0.5" />
                    <span className={cn("text-sm", subTask.completed && "line-through text-muted-foreground")}>
                      {subTask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

