"use client"

import * as React from "react"
import { CalendarIcon, ClockIcon, RepeatIcon, BellIcon, XIcon } from "lucide-react"
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
  const [date, setDate] = React.useState<Date | undefined>(task.deadline ? new Date(task.deadline) : undefined)
  const [time, setTime] = React.useState<string>(task.time || "")
  // Add state for repeat and reminder later if needed

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
    <PopoverPrimitive.Popover open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.PopoverTrigger asChild>
        {children}
      </PopoverPrimitive.PopoverTrigger>
      <PopoverPrimitive.PopoverContent className="w-auto p-0" align="start">
        <TabsPrimitive.Tabs defaultValue="date" className="w-[320px]">
          <TabsPrimitive.TabsList className="grid w-full grid-cols-4">
            <TabsPrimitive.TabsTrigger value="date"><CalendarIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
            <TabsPrimitive.TabsTrigger value="time"><ClockIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
            <TabsPrimitive.TabsTrigger value="repeat" disabled><RepeatIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
            <TabsPrimitive.TabsTrigger value="reminder" disabled><BellIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
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
          
          {/* Placeholder for Repeat and Reminder tabs */}
          <TabsPrimitive.TabsContent value="repeat" className="p-3">
            Repeat settings (coming soon).
          </TabsPrimitive.TabsContent>
          <TabsPrimitive.TabsContent value="reminder" className="p-3">
            Reminder settings (coming soon).
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
      </PopoverPrimitive.PopoverContent>
    </PopoverPrimitive.Popover>
  )
} 