"use client"

import { useState } from "react"
import { Filter, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskItem } from "@/components/tasks/task-item"
import { useTasks } from "@/hooks/use-tasks"

export function TasksList() {
  const { tasks, completedTasks } = useTasks()
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  const filterTasks = (taskList: typeof tasks) => {
    if (priorityFilter === "all") return taskList
    return taskList.filter((task) => task.priority === priorityFilter)
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
            filterTasks(tasks).map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {filterTasks(tasks.filter((task) => !task.completed)).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No active tasks. All done for now!</p>
          ) : (
            filterTasks(tasks.filter((task) => !task.completed)).map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filterTasks(completedTasks).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No completed tasks yet. Complete a task to see it here!
            </p>
          ) : (
            filterTasks(completedTasks).map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

