"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTaskStore } from "@/lib/store/useTaskStore"
import { TaskItem } from "./task-item"
import type { Task } from "@/types/task"

interface TaskFormProps {
  taskId?: string
  isEditing?: boolean
}

export function TaskForm({ taskId, isEditing = false }: TaskFormProps) {
  const router = useRouter()
  const { tasks, updateTask } = useTaskStore()
  const [activePicker, setActivePicker] = useState<{ taskId: string; type: 'dateTime' | 'tag' } | null>(null)
  const task = tasks.find(t => t.id === taskId)

  if (isEditing && !task) {
    return <div>Loading...</div>
  }

  const handleToggleCompletion = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      updateTask(taskId, { completed: !task.completed })
    }
  }

  return task ? (
    <TaskItem
      task={task}
      onToggleCompletion={handleToggleCompletion}
      onOpenSidebar={() => {}}
      activePicker={activePicker}
      onSetActivePicker={setActivePicker}
      showDetails
    />
  ) : null
} 