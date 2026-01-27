import { google, calendar_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'

export class CalendarSyncService {
  private oauth2Client: OAuth2Client

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(connectionId: string): Promise<string> {
    const connection = await prisma.calendarConnection.findUnique({
      where: { id: connectionId }
    })

    if (!connection || !connection.refreshToken) {
      throw new Error('Connection not found or no refresh token available')
    }

    this.oauth2Client.setCredentials({
      refresh_token: connection.refreshToken
    })

    const { credentials } = await this.oauth2Client.refreshAccessToken()

    // Update connection with new tokens
    await prisma.calendarConnection.update({
      where: { id: connectionId },
      data: {
        accessToken: credentials.access_token || undefined,
        tokenExpiry: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : undefined
      }
    })

    return credentials.access_token || ''
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(connectionId: string): Promise<string> {
    const connection = await prisma.calendarConnection.findUnique({
      where: { id: connectionId }
    })

    if (!connection || !connection.accessToken) {
      throw new Error('Connection not found or no access token')
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date()
    const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000)

    if (connection.tokenExpiry && connection.tokenExpiry < expiryBuffer) {
      console.log(`[CalendarSync] Token expired for connection ${connectionId}, refreshing...`)
      return await this.refreshAccessToken(connectionId)
    }

    return connection.accessToken
  }

  /**
   * Set credentials on OAuth2Client with both access and refresh tokens
   */
  async setOAuthCredentials(connectionId: string): Promise<void> {
    const connection = await prisma.calendarConnection.findUnique({
      where: { id: connectionId }
    })

    if (!connection) {
      throw new Error('Connection not found')
    }

    const credentials: any = {
      access_token: connection.accessToken
    }

    if (connection.refreshToken) {
      credentials.refresh_token = connection.refreshToken
    }

    if (connection.tokenExpiry) {
      credentials.expiry_date = connection.tokenExpiry.getTime()
    }

    console.log(`[CalendarSync] Setting OAuth credentials for connection ${connectionId}`)
    console.log(`[CalendarSync] - Has access token: ${!!connection.accessToken}`)
    console.log(`[CalendarSync] - Has refresh token: ${!!connection.refreshToken}`)
    console.log(`[CalendarSync] - Token expiry: ${connection.tokenExpiry}`)
    console.log(`[CalendarSync] - Access token preview: ${connection.accessToken?.substring(0, 30)}...`)

    this.oauth2Client.setCredentials(credentials)
  }

  /**
   * List all calendars for a connection
   */
  async listUserCalendars(connectionId: string): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    const connection = await prisma.calendarConnection.findUnique({
      where: { id: connectionId }
    })

    if (!connection || !connection.accessToken) {
      throw new Error('Connection not found or no access token')
    }

    console.log(`[CalendarSync] Fetching calendar list with direct HTTP request`)
    console.log(`[CalendarSync] - Access token: ${connection.accessToken.substring(0, 30)}...`)

    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Calendar API error: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      console.log(`[CalendarSync] Successfully fetched calendar list: ${data.items?.length || 0} calendars`)
      return data.items || []
    } catch (error: any) {
      console.error(`[CalendarSync] Error calling Google Calendar API:`, error.message)
      throw error
    }
  }

  /**
   * Fetch events from Google Calendar API for a specific calendar
   */
  async fetchEventsFromGoogle(
    connectionId: string,
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<calendar_v3.Schema$Event[]> {
    await this.setOAuthCredentials(connectionId)

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

    let allEvents: calendar_v3.Schema$Event[] = []
    let pageToken: string | undefined

    do {
      const response = await calendar.events.list({
        calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        maxResults: 250,
        singleEvents: true,
        orderBy: 'startTime',
        pageToken
      })

      if (response.data.items) {
        allEvents = allEvents.concat(response.data.items)
      }

      pageToken = response.data.nextPageToken || undefined
    } while (pageToken)

    return allEvents
  }

  /**
   * Incremental sync using syncToken
   */
  async incrementalSync(connectionId: string, calendarId: string): Promise<calendar_v3.Schema$Event[]> {
    const connection = await prisma.calendarConnection.findUnique({
      where: { id: connectionId }
    })

    if (!connection || !connection.accessToken) {
      throw new Error('Connection not found or no access token')
    }

    try {
      let allEvents: any[] = []
      let pageToken: string | undefined
      let newSyncToken: string | undefined

      const params = new URLSearchParams({
        maxResults: '250',
        singleEvents: 'false' // syncToken requires singleEvents: false
      })

      // Use syncToken if available
      if (connection.syncToken) {
        params.set('syncToken', connection.syncToken)
      } else {
        // First sync - get events from 3 months ago to 1 year ahead
        params.set('timeMin', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        params.set('timeMax', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString())
      }

      do {
        if (pageToken) {
          params.set('pageToken', pageToken)
        }

        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${connection.accessToken}`,
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          const errorData = await response.json()

          // Handle specific error codes
          if (response.status === 410 || errorData.error?.message?.includes('Sync token')) {
            console.log(`[CalendarSync] Sync token invalid for ${calendarId}, doing full sync...`)
            await prisma.calendarConnection.update({
              where: { id: connectionId },
              data: { syncToken: null }
            })
            return await this.incrementalSync(connectionId, calendarId)
          }

          throw new Error(`Calendar API error: ${errorData.error?.message || response.statusText}`)
        }

        const data = await response.json()

        if (data.items) {
          allEvents = allEvents.concat(data.items)
        }

        pageToken = data.nextPageToken
        newSyncToken = data.nextSyncToken
      } while (pageToken)

      // Save new sync token
      if (newSyncToken) {
        await prisma.calendarConnection.update({
          where: { id: connectionId },
          data: { syncToken: newSyncToken }
        })
      }

      return allEvents
    } catch (error: any) {
      console.error(`[CalendarSync] Error in incrementalSync:`, error.message)
      throw error
    }
  }

  /**
   * Sync events to local database
   */
  async syncEventsToDatabase(
    connectionId: string,
    events: calendar_v3.Schema$Event[]
  ): Promise<void> {
    for (const event of events) {
      if (!event.id) continue

      // Skip cancelled events or events without start time
      if (event.status === 'cancelled') {
        // Delete from database if exists
        await prisma.calendarEvent.deleteMany({
          where: {
            calendarConnectionId: connectionId,
            externalId: event.id
          }
        })
        continue
      }

      if (!event.start || (!event.start.dateTime && !event.start.date)) {
        continue
      }

      // Parse start and end times
      const startTime = event.start.dateTime
        ? new Date(event.start.dateTime)
        : new Date(event.start.date!)
      const endTime = event.end?.dateTime
        ? new Date(event.end.dateTime)
        : event.end?.date
        ? new Date(event.end.date)
        : new Date(startTime.getTime() + 60 * 60 * 1000) // Default 1 hour

      const isAllDay = !event.start.dateTime

      const lastModified = event.updated ? new Date(event.updated) : new Date()

      // Upsert event
      await prisma.calendarEvent.upsert({
        where: {
          calendarConnectionId_externalId: {
            calendarConnectionId: connectionId,
            externalId: event.id
          }
        },
        update: {
          title: event.summary || 'Untitled Event',
          description: event.description || null,
          location: event.location || null,
          startTime,
          endTime,
          allDay: isAllDay,
          recurrence: event.recurrence ? JSON.stringify(event.recurrence) : null,
          status: event.status || 'confirmed',
          lastModified,
          externalData: event as any
        },
        create: {
          calendarConnectionId: connectionId,
          externalId: event.id,
          title: event.summary || 'Untitled Event',
          description: event.description || null,
          location: event.location || null,
          startTime,
          endTime,
          allDay: isAllDay,
          recurrence: event.recurrence ? JSON.stringify(event.recurrence) : null,
          status: event.status || 'confirmed',
          lastModified,
          externalData: event as any
        }
      })
    }

    // Update lastSynced
    await prisma.calendarConnection.update({
      where: { id: connectionId },
      data: { lastSynced: new Date() }
    })
  }

  /**
   * Delete local events that were deleted in Google Calendar
   */
  async cleanupDeletedEvents(connectionId: string, currentEventIds: string[]): Promise<void> {
    await prisma.calendarEvent.deleteMany({
      where: {
        calendarConnectionId: connectionId,
        externalId: {
          notIn: currentEventIds
        }
      }
    })
  }

  /**
   * Full sync for a connection (all calendars)
   */
  async syncConnection(connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[CalendarSync] Starting sync for connection ${connectionId}`)

      const connection = await prisma.calendarConnection.findUnique({
        where: { id: connectionId }
      })

      if (!connection) {
        console.error(`[CalendarSync] Connection ${connectionId} not found`)
        return { success: false, error: 'Connection not found' }
      }

      if (!connection.isActive) {
        console.log(`[CalendarSync] Connection ${connectionId} is inactive, skipping`)
        return { success: false, error: 'Connection is inactive' }
      }

      if (!connection.accessToken) {
        console.error(`[CalendarSync] Connection ${connectionId} has no access token`)
        return { success: false, error: 'No access token available' }
      }

      console.log(`[CalendarSync] Connection ${connectionId} has valid token, fetching calendars...`)

      // Get all calendars for this connection
      const calendars = await this.listUserCalendars(connectionId)

      console.log(`[CalendarSync] Found ${calendars.length} calendars for connection ${connectionId}`)

      // Sync each calendar
      let totalEventsSynced = 0
      for (const cal of calendars) {
        if (!cal.id) {
          console.log(`[CalendarSync] Skipping calendar with no ID`)
          continue
        }

        console.log(`[CalendarSync] Syncing calendar: ${cal.summary} (${cal.id})`)

        try {
          // Use incremental sync if possible
          const events = await this.incrementalSync(connectionId, cal.id)

          console.log(`[CalendarSync] Fetched ${events.length} events from ${cal.summary}`)

          // Sync events to database
          await this.syncEventsToDatabase(connectionId, events)

          totalEventsSynced += events.length
          console.log(`[CalendarSync] ✅ Synced ${events.length} events from calendar ${cal.summary}`)
        } catch (error: any) {
          console.error(`[CalendarSync] ❌ Error syncing calendar ${cal.id}:`, error.message)
          console.error(error)
          // Continue with other calendars even if one fails
        }
      }

      console.log(`[CalendarSync] ✅ Sync complete for connection ${connectionId}: ${totalEventsSynced} total events`)
      return { success: true }
    } catch (error: any) {
      console.error(`[CalendarSync] ❌ Error syncing connection ${connectionId}:`, error.message)
      console.error(error)
      return { success: false, error: error.message }
    }
  }
}
