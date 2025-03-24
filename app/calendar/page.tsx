import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { TaskCalendar } from "@/components/calendar/task-calendar"

export default function CalendarPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Task Calendar</h1>
        <TaskCalendar />
      </div>
    </DashboardLayout>
  )
}

