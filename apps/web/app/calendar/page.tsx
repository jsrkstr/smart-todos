import { AppLayout } from "@/components/layouts/app-layout"
import { TaskCalendar } from "@/components/calendar/task-calendar"

export default function CalendarPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Task Calendar</h1>
        <TaskCalendar />
      </div>
    </AppLayout>
  )
}

