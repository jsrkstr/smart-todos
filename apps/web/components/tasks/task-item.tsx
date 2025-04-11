"use client"

import { useState } from "react"
import { Calendar, CircleDot, Circle, CircleCheck, MapPin, MoreHorizontal, Star, Clock, Tag, RefreshCw, PanelLeftOpen, Repeat } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/use-tasks"
import type { Task, TaskStage } from "@/types/task"
import { DateTimeRepeatReminderPicker } from "./date-time-repeat-reminder-picker"
import { TagPicker } from "./tag-picker"
import { Input } from "@/components/ui/input"

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
  edit?: boolean
  showDetails?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onToggleCompletion: (taskId: string) => void
  onOpenSidebar: (taskId: string) => void
  activePicker: { taskId: string; type: 'dateTime' | 'tag' } | null
  onSetActivePicker: (picker: { taskId: string; type: 'dateTime' | 'tag' } | null) => void
}

export function TaskItem({
  task,
  edit,
  showDetails,
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
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editedTitle, setEditedTitle] = useState<string>(task.title)

  const isCompleted = task.completed
  const currentStage = task.stage

  const childrenCompleted: number = task.children?.filter(child => child.completed).length || 0
  const childrenTotal: number = task.children?.length || 0
  const childrenProgress: number = childrenTotal > 0 ? Math.round((childrenCompleted / childrenTotal) * 100) : 0

  React.useEffect(() => {
    setIsEditing(!!edit);
  }, [edit]);

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

  const handleTitleClick = (): void => {
    if (!isCompleted) {
      setIsEditing(true)
    }
  }

  const handleTitleBlur = async (): Promise<void> => {
    setIsEditing(false)
    if (editedTitle !== task.title) {
      await updateTask(task.id, { title: editedTitle })
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setEditedTitle(task.title)
      setIsEditing(false)
    }
  }

  const getSuccessVariant = () => {
    return {
      className: "border-transparent bg-green-100 text-green-800 hover:bg-green-200"
    }
  }

  return (
    <div className="relative">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {isEditing ? (
            <input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="text-base"
              autoFocus
              style={{ border: 'none', outline: 'none', width: '100%' }}
            />
          ) : (
            <div
              className={cn(
                "text-base text-gray-800 cursor-pointer",
                isCompleted && "line-through text-gray-500"
              )}
              style={{ height: '1.5rem' }}
              onClick={handleTitleClick}
            >
              {task.title}
            </div>
          )}
          <div className="flex flex-wrap gap-1 text-gray-500" style={{ height: '1.25rem' }}>
            <div className="flex items-center gap-1 -ml-2">
              {task.children && task.children.length > 0 && (
                <div className="flex items-center gap-1 ml-2">
                  {task.children.every(child => child.completed) ?
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
                <div className="flex items-center gap-1 px-2">
                  <Calendar className="h-2 w-2" />
                  {task.deadline && (
                    <span className="text-sm">{format(new Date(task.deadline), 'MMM dd')}</span>
                  )}
                  {task.time && (
                    <span className="text-sm">{task.time}</span>
                  )}
                  {task.repeats && (
                    <Repeat className="h-4 w-4 ml-1 p-1 rounded-[2vw] bg-gray-200" />
                  )}
                </div>
              </DateTimeRepeatReminderPicker>
            </div>

            <TagPicker
              task={task}
              open={activePicker?.taskId === task.id && activePicker?.type === 'tag'}
              onOpenChange={(open) => onSetActivePicker(open ? { taskId: task.id, type: 'tag' } : null)}
            >
              <div className="flex items-center gap-1">
                <Tag className="h-2 w-2" />
                {task.tags && task.tags.length > 0 && (
                  <span className="text-sm">{task.tags.map((tag) => tag.name).join(', ')}</span>
                )}
              </div>
            </TagPicker>
          </div>
        </div>

        {showDetails ?
          <CheckboxPrimitive.Checkbox
            className="mt-1 h-5 w-5 border-2"
            checked={task.completed}
            onCheckedChange={() => onToggleCompletion(task.id)}
          /> :
          <ButtonPrimitive.Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onOpenSidebar(task.id)}
          >
            <PanelLeftOpen className="h-4 w-4" />
          </ButtonPrimitive.Button>
        }
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

