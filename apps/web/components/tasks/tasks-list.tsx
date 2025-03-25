"use client"

import { useState } from "react"
import { Filter, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskItem } from "@/components/tasks/task-item"
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog"
import { useTasks } from "@/hooks/use-tasks"
import type { Task } from "@/types/task"

export function TasksList() {
  const { tasks, completedTasks, deleteTask } = useTasks()
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false)

  const filterTasks = (taskList: Task[]): Task[] => {
    if (priorityFilter === "all") return taskList
    return taskList.filter((task: Task) => task.priority === priorityFilter)
  }

  const handleEditTask = (task: Task): void => {
    setTaskToEdit(task)
    setIsEditDialogOpen(true)
  }

  const handleDeleteTask = (taskId: string): void => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask(taskId)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select defaultValue="all" onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button asChild>
          <Link href="/add-task">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filterTasks(tasks).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tasks found. Add a new task to get started!</p>
          ) : (
            filterTasks(tasks).map((task: Task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={() => handleEditTask(task)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {filterTasks(tasks.filter((task: Task) => !task.completed)).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No active tasks. All done for now!</p>
          ) : (
            filterTasks(tasks.filter((task: Task) => !task.completed)).map((task: Task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={() => handleEditTask(task)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filterTasks(completedTasks).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No completed tasks yet. Complete a task to see it here!
            </p>
          ) : (
            filterTasks(completedTasks).map((task: Task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={() => handleEditTask(task)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {taskToEdit && <EditTaskDialog task={taskToEdit} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />}
    </div>
  )
}

