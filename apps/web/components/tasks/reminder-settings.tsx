"use client"

import * as React from "react"
import { XIcon, PlusCircleIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as SelectPrimitive from "@/components/ui/select"
import * as InputPrimitive from "@/components/ui/input"
import * as ButtonPrimitive from "@/components/ui/button"
import type { Task, Notification as OriginalNotification } from '@/types/task'

interface NotificationSettingsProps {
  value: Notification[],
  onChange: (value: Notification[]) => void
}

type Notification = OriginalNotification & { isNew?: boolean };

export function ReminderSettings({ value, onChange }: NotificationSettingsProps) {
  const { toast } = useToast()
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(true)

  React.useEffect(() => {
    console.log('val', value);
    if (!value) {
      setIsInitializing(false)
      return
    }
    setNotifications(value);
    setIsInitializing(false)
  }, [value])

  const handleAddNotification = () => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      mode: 'Push',
      type: 'Reminder',
      relativeTimeValue: 15,
      relativeTimeUnit: 'Minutes',
      author: "User",
      isNew: true,
    }
    const updatedNotifications = [...notifications, newNotification]
    setNotifications(updatedNotifications)
    onChange(updatedNotifications)
  }

  const handleRemoveNotification = (id: string) => {
    const updatedNotifications = notifications.filter(r => r.id !== id)
    setNotifications(updatedNotifications)
    onChange(updatedNotifications)
  }

  const handleNotificationModeChange = (id: string, mode: 'Push' | 'Email' | 'Chat') => {
    const updatedNotifications = notifications.map(r => 
      r.id === id ? { ...r, mode } : r
    )
    setNotifications(updatedNotifications)
    onChange(updatedNotifications)
  }

  const handleNotificationTimeChange = (id: string, time: number) => {
    const updatedNotifications = notifications.map(r => 
      r.id === id ? { ...r, relativeTimeValue: time } : r
    )
    setNotifications(updatedNotifications)
    onChange(updatedNotifications)
  }

  const handleNotificationUnitChange = (id: string, unit: 'Minutes' | 'Hours' | 'Days') => {
    const updatedNotifications = notifications.map(r => 
      r.id === id ? { ...r, relativeTimeUnit: unit } : r
    )
    setNotifications(updatedNotifications)
    onChange(updatedNotifications)
  }

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          {notifications.map((notification) => (
            <div key={notification.id} className="flex items-center gap-2">
              <SelectPrimitive.Select
                value={notification.mode}
                onValueChange={(value) => handleNotificationModeChange(notification.id, value as any)}
              >
                <SelectPrimitive.SelectTrigger className="w-full">
                  <SelectPrimitive.SelectValue placeholder="Mode" />
                </SelectPrimitive.SelectTrigger>
                <SelectPrimitive.SelectContent>
                  <SelectPrimitive.SelectItem value="Email">Email</SelectPrimitive.SelectItem>
                  <SelectPrimitive.SelectItem value="Push">Notification</SelectPrimitive.SelectItem>
                  <SelectPrimitive.SelectItem value="Chat">Chat</SelectPrimitive.SelectItem>
                </SelectPrimitive.SelectContent>
              </SelectPrimitive.Select>
              
              <InputPrimitive.Input
                type="number"
                min="1"
                max="999"
                value={notification.relativeTimeValue}
                onChange={(e) => handleNotificationTimeChange(notification.id, parseInt(e.target.value) || 1)}
                className="w-20"
              />
              
              <SelectPrimitive.Select
                value={notification.relativeTimeUnit}
                onValueChange={(value) => handleNotificationUnitChange(notification.id, value as any)}
              >
                <SelectPrimitive.SelectTrigger className="w-full">
                  <SelectPrimitive.SelectValue placeholder="Unit" />
                </SelectPrimitive.SelectTrigger>
                <SelectPrimitive.SelectContent>
                  <SelectPrimitive.SelectItem value="Minutes">minutes</SelectPrimitive.SelectItem>
                  <SelectPrimitive.SelectItem value="Hours">hours</SelectPrimitive.SelectItem>
                  <SelectPrimitive.SelectItem value="Days">days</SelectPrimitive.SelectItem>
                </SelectPrimitive.SelectContent>
              </SelectPrimitive.Select>
              
              <ButtonPrimitive.Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveNotification(notification.id)}
                aria-label="Remove notification"
              >
                <XIcon className="h-4 w-4" />
              </ButtonPrimitive.Button>
            </div>
          ))}
          
          <ButtonPrimitive.Button
            variant="outline"
            size="sm"
            onClick={handleAddNotification}
            className="mt-2 w-full flex items-center justify-center gap-2"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Add notification
          </ButtonPrimitive.Button>
        </>
      )}
    </>
  )
} 