import { create } from 'zustand'
import { CalendarEvent } from "@/types/calendar-events"
import { transformEvent } from './helpers'

interface CalendarStore {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
  loaded: boolean
  
  // Actions
  fetchEvents: () => Promise<void>
  addEvent: (event: CalendarEvent) => Promise<CalendarEvent | null>
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<CalendarEvent | null>
  deleteEvent: (eventId: string) => Promise<void>
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  loading: false,
  error: null,
  loaded: false,

  fetchEvents: async (): Promise<void> => {
    // Skip if already loaded or loading
    if (get().loaded || get().loading) return
    
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/calendar-events')
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events')
      }
      const data: CalendarEvent[] = await response.json()
      set({ events: data.map(transformEvent), loading: false, loaded: true })
    } catch (error) {
      console.error("Failed to fetch calendar events:", error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch calendar events',
        loading: false,
        loaded: true // Mark as loaded even on error to prevent repeated attempts
      })
    }
  },

  addEvent: async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    try {
      const response = await fetch('/api/calendar-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      if (!response.ok) {
        throw new Error('Failed to add calendar event')
      }
      const newEvent = await response.json()
      set(state => ({ events: [...state.events, transformEvent(newEvent)] }))
      return newEvent
    } catch (error) {
      console.error("Failed to add calendar event:", error)
      set({ error: error instanceof Error ? error.message : 'Failed to add calendar event' })
      return null
    }
  },

  updateEvent: async (eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> => {
    try {
      const response = await fetch(`/api/calendar-events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('Failed to update calendar event')
      }
      const updatedEvent = await response.json()
      set(state => ({
        events: state.events.map(event => event.id === eventId ? transformEvent(updatedEvent) : event)
      }))
      return updatedEvent
    } catch (error) {
      console.error("Failed to update calendar event:", error)
      set({ error: error instanceof Error ? error.message : 'Failed to update calendar event' })
      return null
    }
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/calendar-events/${eventId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete calendar event')
      }
      set(state => ({
        events: state.events.filter(event => event.id !== eventId)
      }))
    } catch (error) {
      console.error("Failed to delete calendar event:", error)
      set({ error: error instanceof Error ? error.message : 'Failed to delete calendar event' })
    }
  },
})) 