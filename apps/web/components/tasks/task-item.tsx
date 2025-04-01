"use client"

import { useState } from "react"
import { Calendar, CheckCircle, ChevronDown, ChevronUp, MapPin, MoreHorizontal, Star, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { Task } from "@/types/task"
import { useTasks } from "@/hooks/use-tasks"
import { Badge } from "@/components/ui/badge"

interface TaskItemProps {
  task: Task
  onEdit?: () => void
  onDelete?: () => void
}

export function TaskItem({ task, onEdit, onDelete }: TaskItemProps) {
  const router = useRouter()
  const { toggleTaskCompletion, deleteTask, updateTask } = useTasks()
  const [expanded, setExpanded] = useState<boolean>(false)

  const isCompleted = task.completed
  const currentStage = task.stage
  
  const childrenCompleted: number = task.children?.filter(child => child.completed).length || 0
  const childrenTotal: number = task.children?.length || 0
  const childrenProgress: number = childrenTotal > 0 ? Math.round((childrenCompleted / childrenTotal) * 100) : 0

  const handleEdit = (): void => {
    router.push(`/edit-task/${task.id}`)
  }

  const handlePostpone = (): void => {
    const currentDeadline: Date = new Date(task.deadline as string)
    const nextDay: Date = new Date(currentDeadline)
    nextDay.setDate(currentDeadline.getDate() + 1)

    updateTask(task.id, {
      ...task,
      deadline: nextDay.toISOString(),
    })
  }

  const handleDelete = (): void => {
    deleteTask(task.id)
    if (onDelete) onDelete()
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm transition-all",
        isCompleted && "opacity-70",
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox checked={isCompleted} onCheckedChange={() => toggleTaskCompletion(task.id)} className="mt-1" />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn("font-medium text-lg", isCompleted && "line-through text-muted-foreground")}>
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
                    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePostpone}>Postpone</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
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

              {task.time && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>{task.time}</span>
                </div>
              )}

              {task.location && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span>{task.location}</span>
                </div>
              )}

              {task.children && task.children.length > 0 && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  <span>
                    {childrenCompleted}/{childrenTotal} subtasks
                  </span>
                </div>
              )}
            </div>

            {task.why && (
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Why:</strong> {task.why}
              </p>
            )}

            <Badge variant={isCompleted ? "success" : getStageVariant(currentStage)}>
              {isCompleted ? "Completed" : currentStage}
            </Badge>
          </div>
        </div>

        {task.children && task.children.length > 0 && (
          <div className="mt-3 pl-8">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Subtasks ({childrenCompleted}/{childrenTotal})
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="sr-only">{expanded ? "Collapse" : "Expand"}</span>
              </Button>
            </div>

            <Progress value={childrenProgress} className="h-2 mt-1" />

            {expanded && (
              <div className="mt-2 space-y-1">
                {task.children.map((child, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Checkbox
                      checked={child.completed}
                      className="mt-0.5"
                      onCheckedChange={(checked) => {
                        const updatedChildren = [...task.children!]
                        updatedChildren[index] = { ...updatedChildren[index], completed: !!checked }
                        updateTask(task.id, { children: updatedChildren })
                      }}
                    />
                    <span className={cn("text-sm", child.completed && "line-through text-muted-foreground")}>
                      {child.title}
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

function getStageVariant(stage: TaskStage): "default" | "secondary" | "outline" {
  switch (stage) {
    case "Refinement":
      return "default";
    case "Breakdown":
    case "Planning":
      return "secondary";
    case "Execution":
    case "Reflection":
      return "outline";
    default:
      return "default";
  }
}

