"use client"

import { useState } from "react"
import { Calendar, CheckCircle, ChevronDown, ChevronUp, MapPin, MoreHorizontal, Star, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/use-tasks"
import type { Task, TaskStage } from "@/types/task"

// Import React 19 compatible components
import * as React from "react"
import * as DropdownMenuPrimitive from "@/components/ui/dropdown-menu"
import * as CheckboxPrimitive from "@/components/ui/checkbox"
import * as ButtonPrimitive from "@/components/ui/button"
import * as ProgressPrimitive from "@/components/ui/progress"
import * as BadgePrimitive from "@/components/ui/badge"

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

  const getSuccessVariant = () => {
    return {
      className: "border-transparent bg-green-100 text-green-800 hover:bg-green-200"
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm transition-all",
        isCompleted && "opacity-70",
      )}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <CheckboxPrimitive.Checkbox 
              checked={isCompleted} 
              onCheckedChange={() => toggleTaskCompletion(task.id)} 
              className="h-5 w-5 rounded-full border-gray-300"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn("font-medium text-base", isCompleted && "line-through text-muted-foreground")}>
                {task.title}
              </h3>

              <div className="flex items-center gap-1 shrink-0">
                {task.priority === "high" && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}

                <DropdownMenuPrimitive.DropdownMenu>
                  <DropdownMenuPrimitive.DropdownMenuTrigger asChild>
                    <ButtonPrimitive.Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </ButtonPrimitive.Button>
                  </DropdownMenuPrimitive.DropdownMenuTrigger>
                  <DropdownMenuPrimitive.DropdownMenuContent align="end">
                    <DropdownMenuPrimitive.DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuPrimitive.DropdownMenuItem>
                    <DropdownMenuPrimitive.DropdownMenuItem onClick={handlePostpone}>Postpone</DropdownMenuPrimitive.DropdownMenuItem>
                    <DropdownMenuPrimitive.DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuPrimitive.DropdownMenuItem>
                  </DropdownMenuPrimitive.DropdownMenuContent>
                </DropdownMenuPrimitive.DropdownMenu>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              {task.deadline && (
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{new Date(task.deadline).toLocaleDateString()}</span>
                </div>
              )}

              {task.time && (
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{task.time}</span>
                </div>
              )}

              {task.location && (
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{task.location}</span>
                </div>
              )}

              {task.children && task.children.length > 0 && (
                <div className="flex items-center text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span>
                    {childrenCompleted}/{childrenTotal} 
                  </span>
                </div>
              )}
              
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {task.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {task.why && (
              <p className="text-xs text-gray-500 mt-1">
                {task.why}
              </p>
            )}

            <div className="mt-1">
              <BadgePrimitive.Badge 
                className={cn(
                  "text-xs py-0 px-1.5", 
                  isCompleted ? getSuccessVariant().className : ""
                )} 
                variant={isCompleted ? "default" : getStageVariant(currentStage)}
              >
                {isCompleted ? "Completed" : currentStage}
              </BadgePrimitive.Badge>
            </div>
          </div>
        </div>

        {task.children && task.children.length > 0 && (
          <div className="mt-2 pl-8">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-600">
                {childrenCompleted}/{childrenTotal}
              </div>
              <ButtonPrimitive.Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                <span className="sr-only">{expanded ? "Collapse" : "Expand"}</span>
              </ButtonPrimitive.Button>
            </div>

            <ProgressPrimitive.Progress value={childrenProgress} className="h-1 mt-1" />

            {expanded && (
              <div className="mt-2 space-y-1">
                {task.children.map((child, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckboxPrimitive.Checkbox
                      checked={child.completed}
                      className="h-3.5 w-3.5 rounded-sm"
                      onCheckedChange={(checked) => {
                        const updatedChildren = [...task.children!]
                        updatedChildren[index] = { ...updatedChildren[index], completed: !!checked }
                        updateTask(task.id, { children: updatedChildren })
                      }}
                    />
                    <span className={cn("text-xs", child.completed && "line-through text-muted-foreground")}>
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

