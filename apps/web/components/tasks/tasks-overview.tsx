"use client"

import { useState } from "react"
import { CheckCircle2, Clock, Filter, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskItem } from "@/components/tasks/task-item"
import { useTasks } from "@/hooks/use-tasks"
import { QuoteCard } from "@/components/profile/quote-card"
import type { Task } from "@/types/task"
import type React from "react"

export function TasksOverview(): JSX.Element {
  const { tasks, completedTasks } = useTasks()
  const [activeTab, setActiveTab] = useState<string>("today")

  const completionRate: number = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0

  return (
    <div className="container mx-auto py-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Task Progress</CardTitle>
            <CardDescription>Your daily task completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-sm text-muted-foreground">
                  {completedTasks.length} of {tasks.length} tasks completed
                </p>
              </div>
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <Progress value={completionRate} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Tasks due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.slice(0, 3).map((task: Task) => (
                <div key={task.id} className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Due {new Date(task.deadline).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <QuoteCard />
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">My Tasks</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button asChild>
              <Link href="/add-task">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="today" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {tasks
              .filter((task: Task) => new Date(task.deadline).toDateString() === new Date().toDateString())
              .map((task: Task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            {tasks.filter((task: Task) => new Date(task.deadline).toDateString() === new Date().toDateString()).length ===
              0 && (
              <p className="text-center text-muted-foreground py-8">
                No tasks for today. Add a new task to get started!
              </p>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {tasks
              .filter(
                (task: Task) =>
                  new Date(task.deadline) > new Date() &&
                  new Date(task.deadline).toDateString() !== new Date().toDateString(),
              )
              .map((task: Task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            {tasks.filter(
              (task: Task) =>
                new Date(task.deadline) > new Date() &&
                new Date(task.deadline).toDateString() !== new Date().toDateString(),
            ).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No upcoming tasks. Plan ahead by adding new tasks!
              </p>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedTasks.map((task: Task) => (
              <TaskItem key={task.id} task={task} />
            ))}
            {completedTasks.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No completed tasks yet. Complete a task to see it here!
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

