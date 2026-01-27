import { useState, useEffect } from 'react'

export interface CalendarConnection {
  id: string
  provider: string
  name: string | null
  isActive: boolean
  calendarId: string | null
  lastSynced: Date | null
  syncFrequency: string
  tokenExpiry: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface SyncStatus {
  id: string
  name: string | null
  provider: string
  isActive: boolean
  lastSynced: Date | null
  eventCount: number
}

export function useCalendarConnections() {
  const [connections, setConnections] = useState<CalendarConnection[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/calendar/connections')
      if (!response.ok) throw new Error('Failed to fetch connections')
      const data = await response.json()
      setConnections(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/calendar/sync')
      if (!response.ok) throw new Error('Failed to fetch sync status')
      const data = await response.json()
      setSyncStatus(data.connections)
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchConnections(), fetchSyncStatus()])
      setIsLoading(false)
    }
    loadData()
  }, [])

  const triggerSync = async (connectionId?: string) => {
    setIsSyncing(true)
    setError(null)
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      })

      if (!response.ok) throw new Error('Sync failed')

      const result = await response.json()
      await fetchSyncStatus()
      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsSyncing(false)
    }
  }

  const updateConnection = async (
    connectionId: string,
    updates: { name?: string; isActive?: boolean; syncFrequency?: string }
  ) => {
    try {
      const response = await fetch(`/api/calendar/connections/${connectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('Update failed')

      await fetchConnections()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/calendar/connections/${connectionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Delete failed')

      await fetchConnections()
      await fetchSyncStatus()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return {
    connections,
    syncStatus,
    isLoading,
    isSyncing,
    error,
    triggerSync,
    updateConnection,
    deleteConnection,
    refresh: () => {
      fetchConnections()
      fetchSyncStatus()
    }
  }
}
