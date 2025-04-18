"use client"

import { BarChart, Calendar, CheckCircle, Clock, LineChart, ListTodo } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTasks } from "@/hooks/use-tasks"

export function ProgressTracking() {
  const { tasks, completedTasks } = useTasks()

  // Calculate completion rate
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0

  // Calculate average completion time (in days)
  const calculateAvgCompletionTime = () => {
    if (completedTasks.length === 0) return 0

    const totalDays = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt).getTime()
      const completed = new Date().getTime() // In a real app, we'd store completion date
      const days = Math.round((completed - created) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)

    return (totalDays / completedTasks.length).toFixed(1)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Tasks</CardTitle>
            <CardDescription>All tasks created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <ListTodo className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Completed</CardTitle>
            <CardDescription>Tasks finished</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{completedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Completion Rate</CardTitle>
            <CardDescription>Task success rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Avg. Completion</CardTitle>
            <CardDescription>Average days to complete</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{calculateAvgCompletionTime()}</p>
                <p className="text-sm text-muted-foreground">days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily">
        <TabsList className="mb-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Daily Progress</CardTitle>
              <CardDescription>Your task completion for today</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <LineChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Daily progress chart will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Progress</CardTitle>
              <CardDescription>Your task completion for this week</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <BarChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Weekly progress chart will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Progress</CardTitle>
              <CardDescription>Your task completion for this month</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Monthly progress chart will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

