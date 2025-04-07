"use client"

import * as React from "react"
import { CalendarIcon, ClockIcon, RepeatIcon, BellIcon, XIcon, PlusCircleIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/use-tasks"
import type { Task, Notification } from "@/types/task"

import * as PopoverPrimitive from "@/components/ui/popover"
import * as ButtonPrimitive from "@/components/ui/button"
import * as CalendarPrimitive from "@/components/ui/calendar"
import * as InputPrimitive from "@/components/ui/input"
import * as SelectPrimitive from "@/components/ui/select"
import * as LabelPrimitive from "@/components/ui/label"
import * as TabsPrimitive from "@/components/ui/tabs"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/drawer"
import { RepeatSettings } from "./repeat-settings"
import { ReminderSettings } from "./reminder-settings"
import { useToast } from "@/components/ui/use-toast"


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
            <ReminderSettings value={task.notifications} onChange={(value: Notification[]) => {
              updateTask(task.id, { notifications: value})
            }} />
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