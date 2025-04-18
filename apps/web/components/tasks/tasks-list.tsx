"use client"

import * as React from "react"
import { useState } from "react"
import { useTasks } from "@/hooks/use-tasks"
import type { Task, TaskPriority } from "@/types/task"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { TaskItem } from "./task-item"
import { useRouter, useSearchParams } from "next/navigation"
import { Skeleton } from "../ui/skeleton"
import { cn } from "@/lib/utils"
import { PlusSquare } from "lucide-react"
import { Button } from "../ui/button"
import { TaskForm } from "./task-form"

interface TaskGroup {
  title: string;
  tasks: Task[];
  priority: TaskPriority;
  completed: boolean;
  date?: string;
}

interface TasksListProps {
  parentId?: string;
  showSidebar?: boolean;
}

export function TasksList({ parentId, showSidebar = true }: TasksListProps) {
  const router = useRouter()
  const searchParams = useSearchParams();
  const { initialized: storeInitialized, loading, tasks, updateTask, addTask } = useTasks()
  const [activePicker, setActivePicker] = useState<{ taskId: string; type: 'dateTime' | 'tag' } | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const isSubtaskList = !!parentId;

  // Filter tasks based on parentId
  const filteredTasks = parentId
    ? tasks.filter(task => task.parentId === parentId)
    : tasks.filter(task => !task.parentId); // Root tasks only when no parentId

  // Group tasks by priority
  const highPriorityTasks = filteredTasks.filter(task => task.priority === "high" && !task.completed)
  const mediumPriorityTasks = filteredTasks.filter(task => task.priority === "medium" && !task.completed)
  const lowPriorityTasks = filteredTasks.filter(task => task.priority === "low" && !task.completed)
  const completedTasks = filteredTasks.filter(task => task.completed)
  const todayTasks = filteredTasks.filter(task => {
    if (!task.date) return false;
    const taskDate = new Date(task.date);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString() && !task.completed;
  });

  React.useEffect(() => {
    if (!searchParams.get('task-id') && selectedTaskId) {
      console.log('set  unll')
      setSelectedTaskId(null);
    }
  }, [searchParams])

  // Create task groups
  const taskGroups: TaskGroup[] = [
    ...(isSubtaskList ? [
      {
        title: "Sub Tasks",
        tasks: filteredTasks,
        priority: 'medium',
        completed: false,
      }
    ] :
    [
      {
        title: "Today",
        tasks: todayTasks,
        priority: 'high',
        completed: false,
        date: (new Date()).toDateString(),
      },
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
    ])
  ]

  const toggleTaskCompletion = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      updateTask(taskId, { completed: !task.completed })
    }
  }

  const addNewTask = async (group: TaskGroup) => {
    const newTask = await addTask({
      title: '',
      priority: group.priority,
      completed: group.completed,
      parentId: parentId, // Set parentId if provided
      ...(group.date ? {
        date: group.date
      }: {}),
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
    });
    if (newTask) {
      setEditingTaskId(newTask.id);
    }
  }

  const onOpenSidebar = (id: string) => {
    if (!showSidebar) return;
    router.push(`?task-id=${id}`);
    setSelectedTaskId(id);
  }

  const onOpenChange = (open: boolean) => {
    if (!open && searchParams.get('task-id')) {
      router.back();
    }
    setSelectedTaskId(open ? selectedTaskId : null);
  }

  // Don't show groups with no tasks
  const visibleTaskGroups = taskGroups;//.filter(group => group.tasks.length > 0);

  return (
    <div>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {storeInitialized && !loading ?
          visibleTaskGroups.length > 0 ? (
            visibleTaskGroups.map((group) => (
              <div key={group.title} className="">
                <div className={cn('flex justify-between', group.tasks.length ? 'mb-3' : 'mb-2')}>
                  <h4 className={cn('text-l', !isSubtaskList && 'font-bold', 'text-gray-600')}>
                    {group.title}
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 items-baseline"
                    onClick={() => addNewTask(group)}>
                    <PlusSquare className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {group.tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleCompletion={toggleTaskCompletion}
                      onOpenSidebar={(id) => onOpenSidebar(id)}
                      activePicker={activePicker}
                      onSetActivePicker={setActivePicker}
                      edit={editingTaskId === task.id}
                    />
                  ))}
                </div>
                <div className="extra-space text-gray-400 mt-2 hidden h-2" onClick={() => addNewTask(group)}>
                  +
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 my-4">
              No tasks found
            </div>
          )
          :
          <div>
            <Skeleton className="h-10 w-[200px] mb-8" />
            <Skeleton className="h-7 w-full mb-8" />
            <Skeleton className="h-7 w-full mb-8" />
            <Skeleton className="h-7 w-full mb-8" />
            <Skeleton className="h-10 w-[200px] mb-8 mt-8" />
            <Skeleton className="h-7 w-full mb-8" />
            <Skeleton className="h-7 w-full mb-8" />
            <Skeleton className="h-7 w-full mb-8" />
          </div>
        }
      </div>
        <Sheet open={!!selectedTaskId} onOpenChange={(open) => onOpenChange(open)}>
          <SheetContent side="right" className="w-[100%] sm:w-[600px]">
            <SheetHeader className="h-4">
              <SheetTitle id="task-details-title" className="sr-only">Task Details</SheetTitle>
              <SheetDescription className="sr-only">
                Detailed view and editing options for the selected task.
              </SheetDescription>
            </SheetHeader>
            {selectedTaskId && <TaskForm taskId={selectedTaskId} />}
          </SheetContent>
        </Sheet>
    </div>
  )
}

