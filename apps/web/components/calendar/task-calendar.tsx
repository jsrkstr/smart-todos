"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTasks } from "@/hooks/use-tasks"
import type { Task } from "@/types/task"

// Helper to get days in month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate()
}

// Helper to get day of week (0 = Sunday, 6 = Saturday)
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay()
}

// Helper to get start and end dates of a week
const getWeekDates = (date: Date) => {
  const day = date.getDay()
  const diff = date.getDate() - day
  const weekStart = new Date(date)
  weekStart.setDate(diff)

  const weekDates = []
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart)
    currentDate.setDate(weekStart.getDate() + i)
    weekDates.push(currentDate)
  }

  return weekDates
}

// Helper to categorize tasks by time of day
const categorizeTasksByTime = (tasks: Task[]) => {
  const morning: Task[] = []
  const afternoon: Task[] = []
  const evening: Task[] = []

  tasks.forEach((task) => {
    const time = task.time || "09:00" // Default to morning if no time
    const hour = Number.parseInt(time.split(":")[0])

    if (hour < 12) {
      morning.push(task)
    } else if (hour < 17) {
      afternoon.push(task)
    } else {
      evening.push(task)
    }
  })

  // Sort tasks by time within each category
  const sortByTime = (a: Task, b: Task) => {
    const timeA = a.time || "00:00"
    const timeB = b.time || "00:00"
    return timeA.localeCompare(timeB)
  }

  morning.sort(sortByTime)
  afternoon.sort(sortByTime)
  evening.sort(sortByTime)

  return { morning, afternoon, evening }
}

export function TaskCalendar() {
  const { tasks } = useTasks()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"week" | "month">("week")

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)
  const weekDates = getWeekDates(currentDate)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Navigate to previous period
  const prevPeriod = () => {
    if (view === "month") {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() - 7)
      setCurrentDate(newDate)
    }
  }

  // Navigate to next period
  const nextPeriod = () => {
    if (view === "month") {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + 7)
      setCurrentDate(newDate)
    }
  }

  // Get tasks for a specific day
  const getTasksForDay = (date: Date) => {
    return tasks.filter((task) => {
      const taskDate = new Date(task.date)
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      )
    })
  }

  // Create calendar grid for month view
  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Format date for display
  const formatDateHeader = () => {
    if (view === "month") {
      return `${monthNames[currentMonth]} ${currentYear}`
    } else {
      const startDate = weekDates[0]
      const endDate = weekDates[6]

      if (startDate.getMonth() === endDate.getMonth()) {
        return `${monthNames[startDate.getMonth()]} ${startDate.getDate()} - ${endDate.getDate()}, ${startDate.getFullYear()}`
      } else {
        return `${monthNames[startDate.getMonth()]} ${startDate.getDate()} - ${monthNames[endDate.getMonth()]} ${endDate.getDate()}, ${startDate.getFullYear()}`
      }
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevPeriod}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-medium">{formatDateHeader()}</h2>
            <Button variant="outline" size="icon" onClick={nextPeriod}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Tabs defaultValue="week" value={view} onValueChange={(v) => setView(v as "week" | "month")}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button asChild>
              <Link href="/add-task">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Link>
            </Button>
          </div>
        </div>

        {view === "month" ? (
          <div className="grid grid-cols-7 gap-1">
            {/* Day names */}
            {dayNames.map((day) => (
              <div key={day} className="text-center font-medium py-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-24 p-1 bg-muted/30 rounded-md" />
              }

              const date = new Date(currentYear, currentMonth, day)
              const dayTasks = getTasksForDay(date)
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth &&
                new Date().getFullYear() === currentYear

              return (
                <HoverCard key={`day-${day}`}>
                  <HoverCardTrigger asChild>
                    <div
                      className={`h-24 p-1 border rounded-md overflow-hidden ${
                        isToday ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{day}</span>
                        {dayTasks.length > 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 rounded-full">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={`text-xs truncate p-1 rounded ${
                              task.completed
                                ? "line-through text-muted-foreground bg-muted/30"
                                : task.priority === "high"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                  : task.priority === "medium"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            }`}
                          >
                            {task.time && <span className="mr-1">{task.time}</span>}
                            {task.title}
                          </div>
                        ))}

                        {dayTasks.length > 3 && (
                          <div className="text-xs text-muted-foreground">+{dayTasks.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  </HoverCardTrigger>

                  {dayTasks.length > 0 && (
                    <HoverCardContent className="w-80 p-0">
                      <div className="p-4">
                        <h3 className="font-medium mb-2">
                          {date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                        </h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {dayTasks.map((task) => (
                            <div
                              key={task.id}
                              className={`p-2 rounded-md border ${task.completed ? "opacity-60" : ""}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`font-medium ${task.completed ? "line-through" : ""}`}>
                                  {task.title}
                                </span>
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    task.priority === "high"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                      : task.priority === "medium"
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              </div>
                              {task.time && <div className="text-sm text-muted-foreground mt-1">Time: {task.time}</div>}
                              {task.location && (
                                <div className="text-sm text-muted-foreground">Location: {task.location}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </HoverCardContent>
                  )}
                </HoverCard>
              )
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Week view header */}
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((date, index) => {
                const isToday =
                  new Date().getDate() === date.getDate() &&
                  new Date().getMonth() === date.getMonth() &&
                  new Date().getFullYear() === date.getFullYear()

                return (
                  <div key={index} className={`text-center p-2 ${isToday ? "bg-primary/10 rounded-md font-bold" : ""}`}>
                    <div className="font-medium">{dayNames[index]}</div>
                    <div className="text-sm">{date.getDate()}</div>
                  </div>
                )
              })}
            </div>

            {/* Week view content */}
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((date, dateIndex) => {
                const dayTasks = getTasksForDay(date)
                const { morning, afternoon, evening } = categorizeTasksByTime(dayTasks)

                return (
                  <div key={dateIndex} className="min-h-[400px] border rounded-md p-2">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">MORNING</h4>
                        <div className="space-y-1">
                          {morning.map((task) => (
                            <div
                              key={task.id}
                              className={`text-xs p-1.5 rounded ${
                                task.completed
                                  ? "line-through text-muted-foreground bg-muted/30"
                                  : task.priority === "high"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    : task.priority === "medium"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              }`}
                            >
                              <div className="font-medium">{task.time || "9:00"}</div>
                              <div>{task.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">AFTERNOON</h4>
                        <div className="space-y-1">
                          {afternoon.map((task) => (
                            <div
                              key={task.id}
                              className={`text-xs p-1.5 rounded ${
                                task.completed
                                  ? "line-through text-muted-foreground bg-muted/30"
                                  : task.priority === "high"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    : task.priority === "medium"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              }`}
                            >
                              <div className="font-medium">{task.time || "13:00"}</div>
                              <div>{task.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">EVENING</h4>
                        <div className="space-y-1">
                          {evening.map((task) => (
                            <div
                              key={task.id}
                              className={`text-xs p-1.5 rounded ${
                                task.completed
                                  ? "line-through text-muted-foreground bg-muted/30"
                                  : task.priority === "high"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    : task.priority === "medium"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              }`}
                            >
                              <div className="font-medium">{task.time || "18:00"}</div>
                              <div>{task.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

