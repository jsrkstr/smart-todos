"use client"

import { TaskForm } from "./task-form"

interface EditTaskFormProps {
  taskId: string
}

export function EditTaskForm({ taskId }: EditTaskFormProps) {
  return <TaskForm taskId={taskId} isEditing={true} />
}

