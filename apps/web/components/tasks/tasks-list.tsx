"use client"

import * as React from "react"
import { useState } from "react"
import { useTasks } from "@/hooks/use-tasks"
import type { Task } from "@/types/task"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EditTaskForm } from "./edit-task-form"
import { TaskItem } from "./task-item"

export function TasksList() {
  const { tasks, updateTask } = useTasks()
  const [activePicker, setActivePicker] = useState<{ taskId: string; type: 'dateTime' | 'tag' } | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Group tasks by priority
  const highPriorityTasks = tasks.filter(task => task.priority === "high" && !task.completed)
  const mediumPriorityTasks = tasks.filter(task => task.priority === "medium" && !task.completed)
  const lowPriorityTasks = tasks.filter(task => task.priority === "low" && !task.completed)
  const completedTasks = tasks.filter(task => task.completed)

  // Create task groups
  const taskGroups = [
    {
      title: "High Priority",
      tasks: highPriorityTasks,
    },
    {
      title: "Medium Priority",
      tasks: mediumPriorityTasks,
    },
    {
      title: "Low Priority",
      tasks: lowPriorityTasks,
    },
    {
      title: "Completed",
      tasks: completedTasks,
    },
  ].filter(group => group.tasks.length > 0)

  const toggleTaskCompletion = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      updateTask(taskId, { completed: !task.completed })
    }
  }

  return (
    <div>
      <div className="max-w-2xl mx-auto p-4">
        {taskGroups.map((group) => (
          <div key={group.title} className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">{group.title}</h2>
            <div className="space-y-3">
              {group.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleCompletion={toggleTaskCompletion}
                  onOpenSidebar={setSelectedTaskId}
                  activePicker={activePicker}
                  onSetActivePicker={setActivePicker}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <Sheet open={!!selectedTaskId} onOpenChange={(open) => setSelectedTaskId(open ? selectedTaskId : null)}>
        <SheetContent side="right" className="w-[100%] sm:w-[500px]">
          <SheetHeader>
            <SheetTitle>Task Details</SheetTitle>
            {selectedTaskId && <EditTaskForm taskId={selectedTaskId} />}
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  )
}

