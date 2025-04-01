import { useEffect } from "react"
import { useCalendarStore } from "@/lib/store/calendar-store/useCalendarStore"
import { CalendarEvent } from "@/types/calendar-events"

export function useCalendarEvents() {
  const { 
    events, 
    loading: isLoading, 
    error,
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent 
  } = useCalendarStore()

  // Fetch events on mount
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent
  }
} 