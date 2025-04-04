"use client"

import { useState } from "react"
import { Calendar, CircleDot, Circle, CircleCheck, MapPin, MoreHorizontal, Star, Clock, Tag, RefreshCw, PanelLeftOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/use-tasks"
import type { Task, TaskStage } from "@/types/task"
import { DateTimeRepeatReminderPicker } from "./date-time-repeat-reminder-picker"
import { TagPicker } from "./tag-picker"

// Import React 19 compatible components
import * as React from "react"
import * as DropdownMenuPrimitive from "@/components/ui/dropdown-menu"
import * as CheckboxPrimitive from "@/components/ui/checkbox"
import * as ButtonPrimitive from "@/components/ui/button"
import * as ProgressPrimitive from "@/components/ui/progress"
import * as BadgePrimitive from "@/components/ui/badge"
import { format } from "date-fns"

interface TaskItemProps {
  task: Task
  onEdit?: () => void
  onDelete?: () => void
  onToggleCompletion: (taskId: string) => void
  onOpenSidebar: (taskId: string) => void
  activePicker: { taskId: string; type: 'dateTime' | 'tag' } | null
  onSetActivePicker: (picker: { taskId: string; type: 'dateTime' | 'tag' } | null) => void
}

export function TaskItem({ 
  task, 
  onEdit, 
  onDelete,
  onToggleCompletion,
  onOpenSidebar,
  activePicker,
  onSetActivePicker
}: TaskItemProps) {
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
    <div className="relative">
      <div className="flex items-start gap-3">
        <CheckboxPrimitive.Checkbox
          className="mt-1 h-5 w-5 border-2"
          checked={task.completed}
          onCheckedChange={() => onToggleCompletion(task.id)}
        />
        <div className="flex-1">
          <div className="text-l text-gray-800">{task.title}</div>
          <div className="flex flex-wrap text-gray-500">
            <div className="flex items-center gap-1">
              {task.children && task.children.length > 0 && (
                <div className="flex items-center gap-1">
                  { task.children.every(child => child.completed) ?
                    <CircleCheck className="h-4 w-4" /> :
                    task.children.some(child => child.completed) ?
                    <CircleDot className="h-4 w-4" /> :
                    <Circle className="h-4 w-4" />}
                  <div
                  >
                    <span className="text-sm">
                      {task.children.filter(child => child.completed).length}/{task.children.length}
                    </span>
                  </div>
                </div>
              )}

              <DateTimeRepeatReminderPicker
                task={task}
                open={activePicker?.taskId === task.id && activePicker?.type === 'dateTime'}
                onOpenChange={(open) => onSetActivePicker(open ? { taskId: task.id, type: 'dateTime' } : null)}
              >
                <ButtonPrimitive.Button
                  variant="ghost"
                  size="sm"
                  className="h-8 p-0"
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {task.deadline && (
                      <span className="text-sm">{format(new Date(task.deadline), 'MMM dd')}</span>
                    )}
                    {task.time && (
                      <span className="text-sm">{task.time}</span>
                    )}
                  </div>
                </ButtonPrimitive.Button>
              </DateTimeRepeatReminderPicker>
            </div>
          
            {/* {task.stage && (
              <div className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4 text-red-500" />
                <span className="text-sm">{task.stage}</span>
              </div>
            )} */}
            <div className="flex items-center gap-1">
              <TagPicker
                task={task}
                open={activePicker?.taskId === task.id && activePicker?.type === 'tag'}
                onOpenChange={(open) => onSetActivePicker(open ? { taskId: task.id, type: 'tag' } : null)}
              >
                <ButtonPrimitive.Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Tag className="h-4 w-4" />
                </ButtonPrimitive.Button>
              </TagPicker>
              {task.tags && task.tags.length > 0 && (
                <span className="text-sm">{task.tags.map((tag) => tag.name).join(', ')}</span>
              )}
            </div>
          </div>
        </div>
        <ButtonPrimitive.Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onOpenSidebar(task.id)}
        >
          <PanelLeftOpen className="h-4 w-4" />
        </ButtonPrimitive.Button>
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

