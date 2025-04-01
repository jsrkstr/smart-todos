"use client"

import { AppLayout } from "@/components/layouts/app-layout"
import { CalendarView } from "@/components/calendar/calendar-view"

export default function CalendarPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Calendar</h1>
        <CalendarView />
      </div>
    </AppLayout>
  )
}

