"use client"

import * as React from "react"
import { useState } from "react"
import { useTasks } from "@/hooks/use-tasks"
import type { Task, TaskPriority } from "@/types/task"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EditTaskForm } from "./edit-task-form"
import { TaskItem } from "./task-item"

interface TaskGroup {
  title: string;
  tasks: Task[];
  priority: TaskPriority;
  completed: boolean;
}

export function TasksList() {
  const { tasks, updateTask, addTask } = useTasks()
  const [activePicker, setActivePicker] = useState<{ taskId: string; type: 'dateTime' | 'tag' } | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Group tasks by priority
  const highPriorityTasks = tasks.filter(task => task.priority === "high" && !task.completed)
  const mediumPriorityTasks = tasks.filter(task => task.priority === "medium" && !task.completed)
  const lowPriorityTasks = tasks.filter(task => task.priority === "low" && !task.completed)
  const completedTasks = tasks.filter(task => task.completed)

  // Create task groups
  const taskGroups: TaskGroup[] = [
    {
      title: "High Priority",
      tasks: highPriorityTasks,
      priority: 'high',
      completed: false,
    },
    {
      title: "Medium Priority",
      tasks: mediumPriorityTasks,
      priority: 'medium',
      completed: false,
    },
    {
      title: "Low Priority",
      tasks: lowPriorityTasks,
      priority: 'low',
      completed: false,
    },
    {
      title: "Completed",
      tasks: completedTasks,
      priority: 'high',
      completed: true,
    },
  ].filter(group => group.tasks.length > 0)

  const toggleTaskCompletion = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      updateTask(taskId, { completed: !task.completed })
    }
  }

  const addNewTask = (group: TaskGroup) => {
    addTask({
      title: '',
      priority: group.priority,
      completed: group.completed,
      notifications: [{
        mode: 'Push',
        type: 'Reminder',
        trigger: 'RelativeTime',
        relativeTimeValue: 15,
        relativeTimeUnit: 'Minutes',
        author: 'Bot',
      }, {
        mode: 'Push',
        type: 'Reminder',
        trigger: 'RelativeTime',
        relativeTimeValue: 30,
        relativeTimeUnit: 'Minutes',
        author: 'Bot',
      }],
    })
  }

  return (
    <div>
      <div className="max-w-2xl mx-auto">
        {taskGroups.map((group) => (
          <div key={group.title} className="">
            <h4 className="text-xl font-bold mb-4 text-gray-800">{group.title}</h4>
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
            <div className="extra-space" style={{ height: '2rem' }} onClick={() => addNewTask(group)}></div>
          </div>
        ))}
      </div>
      <Sheet open={!!selectedTaskId} onOpenChange={(open) => setSelectedTaskId(open ? selectedTaskId : null)}>
        <SheetContent side="right" className="w-[100%] sm:w-[500px]">
          <SheetHeader>
            <SheetTitle>Task Details</SheetTitle>
          </SheetHeader>
          {selectedTaskId && <EditTaskForm taskId={selectedTaskId} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

