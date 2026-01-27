"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Loader2, RefreshCw, Trash2, Calendar as CalendarIcon } from "lucide-react"
import { useCalendarConnections } from "@/hooks/use-calendar-connections"
import { formatDistanceToNow } from "date-fns"

export function CalendarConnections() {
  const { connections, syncStatus, isLoading, isSyncing, error, triggerSync, updateConnection, deleteConnection } =
    useCalendarConnections()

  const handleSync = async (connectionId?: string) => {
    try {
      await triggerSync(connectionId)
    } catch (err) {
      console.error('Sync failed:', err)
    }
  }

  const handleToggleActive = async (connectionId: string, isActive: boolean) => {
    try {
      await updateConnection(connectionId, { isActive })
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  const handleDelete = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this calendar?')) return
    try {
      await deleteConnection(connectionId)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const connectGoogle = () => {
    window.location.href = '/api/calendar/connect'
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendar Connections</CardTitle>
          <CardDescription>Manage your calendar integrations and sync settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {connections.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No calendar connections</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Google Calendar to sync events and enhance AI scheduling
              </p>
              <Button onClick={connectGoogle}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Connect Google Calendar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => {
                const status = syncStatus.find((s) => s.id === connection.id)

                return (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{connection.name || connection.provider}</h4>
                        <Badge variant={connection.isActive ? "default" : "secondary"}>
                          {connection.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Last synced:{" "}
                          {connection.lastSynced
                            ? formatDistanceToNow(new Date(connection.lastSynced), { addSuffix: true })
                            : "Never"}
                        </p>
                        {status && <p>Events: {status.eventCount}</p>}
                        <p>Sync frequency: {connection.syncFrequency}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={connection.isActive}
                        onCheckedChange={(checked) => handleToggleActive(connection.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(connection.id)}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(connection.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}

              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Add another calendar connection
                </p>
                <Button variant="outline" onClick={connectGoogle}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Connect Google Calendar
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={() => handleSync()}
                  disabled={isSyncing}
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing all calendars...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync all calendars now
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
