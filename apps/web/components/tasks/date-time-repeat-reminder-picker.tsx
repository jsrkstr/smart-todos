"use client"

import * as React from "react"
import { CalendarIcon, ClockIcon, RepeatIcon, BellIcon, XIcon, PlusCircleIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/use-tasks"
import type { Task } from "@/types/task"

import * as PopoverPrimitive from "@/components/ui/popover"
import * as ButtonPrimitive from "@/components/ui/button"
import * as CalendarPrimitive from "@/components/ui/calendar"
import * as InputPrimitive from "@/components/ui/input"
import * as SelectPrimitive from "@/components/ui/select"
import * as LabelPrimitive from "@/components/ui/label"
import * as TabsPrimitive from "@/components/ui/tabs"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/drawer"
import { RepeatSettings } from "./repeat-settings"
import { useToast } from "@/components/ui/use-toast"

interface Reminder {
  id: string
  type: 'Push' | 'Email' | 'Chat'
  time: number
  unit: 'minutes' | 'hours' | 'days'
}

// Convert minutes to the appropriate unit for display
const normalizeTimeUnit = (minutes: number): { time: number; unit: 'minutes' | 'hours' | 'days' } => {
  if (minutes < 60) {
    return { time: minutes, unit: 'minutes' }
  } else if (minutes < 1440) {
    return { time: Math.floor(minutes / 60), unit: 'hours' }
  } else {
    return { time: Math.floor(minutes / 1440), unit: 'days' }
  }
}

// Convert time and unit to minutes for storage
const convertToMinutes = (time: number, unit: 'minutes' | 'hours' | 'days'): number => {
  switch (unit) {
    case 'minutes':
      return time
    case 'hours':
      return time * 60
    case 'days':
      return time * 1440
    default:
      return time
  }
}

interface DateTimeRepeatReminderPickerProps {
  task: Task
  children: React.ReactNode // Trigger element
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DateTimeRepeatReminderPicker({
  task,
  children,
  open,
  onOpenChange,
}: DateTimeRepeatReminderPickerProps) {
  const { updateTask } = useTasks()
  const { toast } = useToast()
  const [date, setDate] = React.useState<Date | undefined>(task.deadline ? new Date(task.deadline) : undefined)
  const [time, setTime] = React.useState<string>(task.time || "")
  const [repeatFrequency, setRepeatFrequency] = React.useState<number>(0);
  const [repeatPeriod, setRepeatPeriod] = React.useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [repeatDay, setRepeatDay] = React.useState<number>(1);
  
  // Default reminders state
  const defaultReminders: Reminder[] = [
    { id: "1", type: 'Push', time: 10, unit: 'minutes' },
    { id: "2", type: 'Chat', time: 30, unit: 'minutes' }
  ];
  
  const [reminders, setReminders] = React.useState<Reminder[]>(defaultReminders);
  const [isLoading, setIsLoading] = React.useState(false);

  // Load existing notifications when component mounts or task changes
  React.useEffect(() => {
    const loadExistingNotifications = async () => {
      try {
        setIsLoading(true);
        // Here you would fetch the task's notifications from your API
        // For now, we'll just use our defaults if none exist
        
        // Example API call (commented out)
        // const response = await fetch(`/api/tasks/${task.id}/notifications`);
        // const data = await response.json();
        
        // If we had existing notifications, we would transform them to our format
        // For now, just use the defaults
        setReminders(defaultReminders);
      } catch (error) {
        console.error("Failed to load notifications:", error);
        toast({
          title: "Error",
          description: "Failed to load reminders. Using defaults.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (open && task.id) {
      loadExistingNotifications();
    }
  }, [task.id, open, toast]);

  React.useEffect(() => {
    // Reset date/time when task changes or picker opens
    setDate(task.deadline ? new Date(task.deadline) : undefined)
    setTime(task.time || "")
  }, [task.deadline, task.time, open])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    updateTask(task.id, { deadline: selectedDate?.toISOString() })
    // Potentially close popover or move to time tab
  }

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = event.target.value
    setTime(newTime)
    updateTask(task.id, { time: newTime })
  }

  const handleClear = () => {
    setDate(undefined)
    setTime("")
    updateTask(task.id, { deadline: undefined, time: undefined })
    onOpenChange(false)
  }

  // Reminder handling functions
  const handleAddReminder = () => {
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      type: 'Push',
      time: 15,
      unit: 'minutes'
    }
    setReminders([...reminders, newReminder])
  }

  const handleRemoveReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id))
  }

  const handleReminderTypeChange = (id: string, type: 'Push' | 'Email' | 'Chat') => {
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, type } : r
    ))
  }

  const handleReminderTimeChange = (id: string, time: number) => {
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, time } : r
    ))
  }

  const handleReminderUnitChange = (id: string, unit: 'minutes' | 'hours' | 'days') => {
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, unit } : r
    ))
  }

  // Save reminders as notifications
  const saveReminders = async () => {
    try {
      setIsLoading(true);
      
      // Format the reminders for the API
      const notificationsData = reminders.map(reminder => ({
        type: reminder.type,
        minutesBefore: convertToMinutes(reminder.time, reminder.unit),
        taskId: task.id,
        message: `Reminder: Task "${task.title}" is due soon.`,
        author: "Bot" // Using Bot as the notification creator
      }));
      
      // Example API call (implement according to your backend)
      // const response = await fetch(`/api/tasks/${task.id}/notifications`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(notificationsData)
      // });
      
      // For now, just log what would be saved
      console.log('Saving notifications:', notificationsData);
      
      toast({
        title: "Success",
        description: `${reminders.length} reminders saved successfully.`,
      });
    } catch (error) {
      console.error("Failed to save notifications:", error);
      toast({
        title: "Error",
        description: "Failed to save reminders.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger>
          {children}
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]" aria-describedby="date-description">
          <DrawerHeader className="px-4">
            <DrawerTitle>Select Date</DrawerTitle>
          </DrawerHeader>
          <div id="date-description" className="sr-only">
            Select a date and time for the task. You can also set repeat and reminder options.
          </div>
          <TabsPrimitive.Tabs defaultValue="date">
          <TabsPrimitive.TabsList className="grid w-full grid-cols-4">
            <TabsPrimitive.TabsTrigger value="date"><CalendarIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
            <TabsPrimitive.TabsTrigger value="time"><ClockIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
            <TabsPrimitive.TabsTrigger value="repeat"><RepeatIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
            <TabsPrimitive.TabsTrigger value="reminder"><BellIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
          </TabsPrimitive.TabsList>

          <TabsPrimitive.TabsContent value="date" className="p-3">
            <CalendarPrimitive.Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
          </TabsPrimitive.TabsContent>

          <TabsPrimitive.TabsContent value="time" className="p-3 space-y-3">
             <LabelPrimitive.Label htmlFor="time">Set Time</LabelPrimitive.Label>
             <InputPrimitive.Input 
                id="time"
                type="time"
                value={time}
                onChange={handleTimeChange}
             />
          </TabsPrimitive.TabsContent>
          
          <TabsPrimitive.TabsContent value="repeat" className="p-3">
            <RepeatSettings
              value={task.repeats}
              onChange={(rrule) => {
                updateTask(task.id, { repeats: rrule })
              }}
            />
          </TabsPrimitive.TabsContent>
          <TabsPrimitive.TabsContent value="reminder" className="p-3 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <>
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center gap-2">
                    <SelectPrimitive.Select
                      value={reminder.type}
                      onValueChange={(value) => handleReminderTypeChange(reminder.id, value as any)}
                    >
                      <SelectPrimitive.SelectTrigger className="w-full">
                        <SelectPrimitive.SelectValue placeholder="Type" />
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
                      value={reminder.time}
                      onChange={(e) => handleReminderTimeChange(reminder.id, parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    
                    <SelectPrimitive.Select
                      value={reminder.unit}
                      onValueChange={(value) => handleReminderUnitChange(reminder.id, value as any)}
                    >
                      <SelectPrimitive.SelectTrigger className="w-full">
                        <SelectPrimitive.SelectValue placeholder="Unit" />
                      </SelectPrimitive.SelectTrigger>
                      <SelectPrimitive.SelectContent>
                        <SelectPrimitive.SelectItem value="minutes">minutes</SelectPrimitive.SelectItem>
                        <SelectPrimitive.SelectItem value="hours">hours</SelectPrimitive.SelectItem>
                        <SelectPrimitive.SelectItem value="days">days</SelectPrimitive.SelectItem>
                      </SelectPrimitive.SelectContent>
                    </SelectPrimitive.Select>
                    
                    <ButtonPrimitive.Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveReminder(reminder.id)}
                      aria-label="Remove reminder"
                    >
                      <XIcon className="h-4 w-4" />
                    </ButtonPrimitive.Button>
                  </div>
                ))}
                
                <ButtonPrimitive.Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddReminder}
                  className="mt-2 w-full flex items-center justify-center gap-2"
                >
                  <PlusCircleIcon className="h-4 w-4" />
                  Add notification
                </ButtonPrimitive.Button>
                
                {reminders.length > 0 && (
                  <ButtonPrimitive.Button
                    variant="default"
                    size="sm"
                    onClick={saveReminders}
                    className="mt-2 w-full"
                    disabled={isLoading}
                  >
                    Save Reminders
                  </ButtonPrimitive.Button>
                )}
              </>
            )}
          </TabsPrimitive.TabsContent>
        </TabsPrimitive.Tabs>
        <div className="p-3 border-t flex justify-end">
             <ButtonPrimitive.Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClear}
                disabled={!date && !time}
             >
                Clear
             </ButtonPrimitive.Button>
        </div>
    </DrawerContent>
    </Drawer>
  )
} 