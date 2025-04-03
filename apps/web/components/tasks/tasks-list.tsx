"use client"

import { useState } from "react"
import { Calendar, Clock, Tag, RefreshCw, PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"
// Import React 19 compatible primitive components
import * as React from "react"
import * as CheckboxPrimitive from "@/components/ui/checkbox"
import * as ButtonPrimitive from "@/components/ui/button"
import { useTasks } from "@/hooks/use-tasks"
import type { Task } from "@/types/task"
// Import the new pickers
import { DateTimeRepeatReminderPicker } from "./date-time-repeat-reminder-picker"
import { TagPicker } from "./tag-picker"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet"
import { EditTaskForm } from "./edit-task-form"
import { TaskForm } from "./task-form"

export function TasksList() {
  const { tasks, updateTask } = useTasks()
  // Single state to manage which picker is open for which task
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
                <div key={task.id} className="relative">
                  <div className="flex items-start gap-3">
                    <CheckboxPrimitive.Checkbox
                      className="mt-1 h-6 w-6 rounded-full border-2"
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                    />
                    <div className="flex-1">
                      <div className="text-xl text-gray-800">{task.title}</div>
                      <div className="flex flex-wrap gap-2 mt-1 text-gray-500">
                        {task.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">{new Date(task.deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                        {task.time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{task.time}</span>
                          </div>
                        )}
                        {task.children && task.children.length > 0 && (
                          <div className="flex items-center gap-1">
                            <div
                              className={cn(
                                "h-4 w-4 rounded-full",
                                task.children.every(child => child.completed) ? "bg-purple-500" : "bg-gray-300",
                              )}
                            >
                              <span className="text-[10px] text-white flex items-center justify-center h-full">
                                {task.children.filter(child => child.completed).length}/{task.children.length}
                              </span>
                            </div>
                          </div>
                        )}
                        {task.stage && (
                          <div className="flex items-center gap-1">
                            <RefreshCw className="h-4 w-4 text-red-500" />
                            <span className="text-sm">{task.stage}</span>
                          </div>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          task.tags.map((tag, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <Tag className="h-4 w-4" />
                              <span className="text-sm">{tag.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {/* Combined Picker Trigger (Calendar Icon) */}
                        <DateTimeRepeatReminderPicker
                          task={task}
                          open={activePicker?.taskId === task.id && activePicker?.type === 'dateTime'}
                          onOpenChange={(open) => setActivePicker(open ? { taskId: task.id, type: 'dateTime' } : null)}
                        >
                          <ButtonPrimitive.Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Calendar className="h-4 w-4" />
                          </ButtonPrimitive.Button>
                        </DateTimeRepeatReminderPicker>

                        {/* Tag Picker Trigger (Tag Icon) */}
                        <TagPicker
                          task={task}
                          open={activePicker?.taskId === task.id && activePicker?.type === 'tag'}
                          onOpenChange={(open) => setActivePicker(open ? { taskId: task.id, type: 'tag' } : null)}
                        >
                          <ButtonPrimitive.Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Tag className="h-4 w-4" />
                          </ButtonPrimitive.Button>
                        </TagPicker>

                        {/* Remove Repeat and Bell Buttons as they are part of combined picker */}
                      </div>
                    </div>
                    <ButtonPrimitive.Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <PanelLeftOpen className="h-4 w-4" />
                    </ButtonPrimitive.Button>
                  </div>

                  {/* Remove placeholder divs for pickers */}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Sheet open={!!selectedTaskId} onOpenChange={(open: boolean) => setSelectedTaskId(null)}>
        {/* <SheetTrigger>Open</SheetTrigger> */}
        <SheetContent className="w-[100%] sm:w-[500px]" aria-describedby="abc">
          <SheetHeader>
            <SheetTitle>Are you absolutely sure?</SheetTitle>
            {selectedTaskId &&
              <EditTaskForm taskId={selectedTaskId} />
            }
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  )
}

