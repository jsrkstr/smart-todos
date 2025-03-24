"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTasks } from "@/hooks/use-tasks"

// Helper to get days in month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate()
}

// Helper to get day of week (0 = Sunday, 6 = Saturday)
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay()
}

export function TaskCalendar() {
  const { tasks } = useTasks()
  const [currentDate, setCurrentDate] = useState(new Date())

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)

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

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  // Get tasks for a specific day
  const getTasksForDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    return tasks.filter((task) => {
      const taskDate = new Date(task.deadline)
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      )
    })
  }

  // Create calendar grid
  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-medium">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button asChild>
            <Link href="/add-task">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Link>
          </Button>
        </div>

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

            const dayTasks = getTasksForDay(day)
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === currentMonth &&
              new Date().getFullYear() === currentYear

            return (
              <div
                key={`day-${day}`}
                className={`h-24 p-1 border rounded-md overflow-hidden ${isToday ? "border-primary bg-primary/5" : ""}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{day}</span>
                  {dayTasks.length > 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 rounded-full">{dayTasks.length}</span>
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
                      {task.title}
                    </div>
                  ))}

                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{dayTasks.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

