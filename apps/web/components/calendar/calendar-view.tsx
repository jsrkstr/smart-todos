import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCalendarEvents } from "@/hooks/use-calendar-events"
import { CalendarEvent } from "@/types/calendar-events"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

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

// Helper to categorize events by time of day
const categorizeEventsByTime = (events: CalendarEvent[]) => {
  const morning: CalendarEvent[] = []
  const afternoon: CalendarEvent[] = []
  const evening: CalendarEvent[] = []

  events.forEach((event) => {
    const hour = event.startTime.getHours()

    if (hour < 12) {
      morning.push(event)
    } else if (hour < 17) {
      afternoon.push(event)
    } else {
      evening.push(event)
    }
  })

  // Sort events by time within each category
  const sortByTime = (a: CalendarEvent, b: CalendarEvent) => {
    return a.startTime.getTime() - b.startTime.getTime()
  }

  morning.sort(sortByTime)
  afternoon.sort(sortByTime)
  evening.sort(sortByTime)

  return { morning, afternoon, evening }
}

// Helper function to format time
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function CalendarView() {
  const { events, isLoading } = useCalendarEvents()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"week" | "month">("week")

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)
  const weekDates = getWeekDates(currentDate)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
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

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
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

            <Button variant="outline" onClick={prevPeriod}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button variant="outline" onClick={nextPeriod}>
              <ChevronRight className="h-4 w-4" />
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
              const dayEvents = getEventsForDay(date)
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
                        {dayEvents.length > 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 rounded-full">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs truncate p-1 rounded",
                              event.status === "cancelled" && "line-through text-muted-foreground bg-muted/30",
                              event.allDay && "bg-primary/5"
                            )}
                          >
                            {!event.allDay && <span className="mr-1">{formatTime(event.startTime)}</span>}
                            {event.title}
                          </div>
                        ))}

                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  </HoverCardTrigger>

                  {dayEvents.length > 0 && (
                    <HoverCardContent className="w-80 p-0">
                      <div className="p-4">
                        <h3 className="font-medium mb-2">
                          {date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                        </h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "p-2 rounded-md border",
                                event.status === "cancelled" && "opacity-60"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`font-medium ${event.status === "cancelled" ? "line-through" : ""}`}>
                                  {event.title}
                                </span>
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    event.status === "confirmed" ? "bg-green-100 text-green-700" :
                                    event.status === "tentative" ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {event.status}
                                </span>
                              </div>
                              {!event.allDay && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                </div>
                              )}
                              {event.location && (
                                <div className="text-sm text-muted-foreground">Location: {event.location}</div>
                              )}
                              {event.description && (
                                <div className="text-sm text-muted-foreground mt-1">{event.description}</div>
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
                const dayEvents = getEventsForDay(date)
                const { morning, afternoon, evening } = categorizeEventsByTime(dayEvents)

                return (
                  <div key={dateIndex} className="min-h-[400px] border rounded-md p-2">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">MORNING</h4>
                        <div className="space-y-1">
                          {morning.map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-xs p-1.5 rounded",
                                event.status === "cancelled" && "line-through text-muted-foreground bg-muted/30",
                                event.allDay && "bg-primary/5"
                              )}
                            >
                              <div className="font-medium">{formatTime(event.startTime)}</div>
                              <div>{event.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">AFTERNOON</h4>
                        <div className="space-y-1">
                          {afternoon.map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-xs p-1.5 rounded",
                                event.status === "cancelled" && "line-through text-muted-foreground bg-muted/30",
                                event.allDay && "bg-primary/5"
                              )}
                            >
                              <div className="font-medium">{formatTime(event.startTime)}</div>
                              <div>{event.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">EVENING</h4>
                        <div className="space-y-1">
                          {evening.map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-xs p-1.5 rounded",
                                event.status === "cancelled" && "line-through text-muted-foreground bg-muted/30",
                                event.allDay && "bg-primary/5"
                              )}
                            >
                              <div className="font-medium">{formatTime(event.startTime)}</div>
                              <div>{event.title}</div>
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