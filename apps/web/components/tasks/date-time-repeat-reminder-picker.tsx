"use client"

import * as React from "react"
import { CalendarIcon, ClockIcon, RepeatIcon, BellIcon, XIcon, PlusCircleIcon, Hourglass } from "lucide-react"
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
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/drawer"
import { RepeatSettings } from "./repeat-settings"
import { ReminderSettings } from "./reminder-settings"
import { useToast } from "@/hooks/use-toast"


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
  const [deadline, setDeadline] = React.useState<Date | undefined>(
    task.deadline ? new Date(task.deadline) : undefined
  )
  const [taskDate, setTaskDate] = React.useState<Date>(new Date(task.date))
  const [selectedTab, setSelectedTab] = React.useState<string>('date')

  React.useEffect(() => {
    // Reset date/time when task changes or picker opens
    setDeadline(task.deadline ? new Date(task.deadline) : undefined)
    setTaskDate(new Date(task.date))
  }, [task.deadline, task.date, open])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDeadline(selectedDate)
    updateTask(task.id, { deadline: selectedDate?.toISOString() })
    // Potentially close popover or move to time tab
  }

  const handleTaskDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Preserve the time from the current taskDate
      const currentTaskDate = new Date(taskDate)
      selectedDate.setHours(currentTaskDate.getHours())
      selectedDate.setMinutes(currentTaskDate.getMinutes())
      
      setTaskDate(selectedDate)
      updateTask(task.id, { date: selectedDate.toISOString() })
    }
  }

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = event.target.value
    if (timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number)
      const newDate = new Date(taskDate)
      newDate.setHours(hours)
      newDate.setMinutes(minutes)
      
      setTaskDate(newDate)
      updateTask(task.id, { date: newDate.toISOString() })
    }
  }

  const handleClear = () => {
    setDeadline(undefined)
    // We shouldn't clear the task date completely, but reset to default time (start of day)
    const defaultDate = new Date(taskDate)
    defaultDate.setHours(0)
    defaultDate.setMinutes(0)
    defaultDate.setSeconds(0)
    defaultDate.setMilliseconds(0)
    
    setTaskDate(defaultDate)
    updateTask(task.id, { 
      deadline: undefined,
      date: defaultDate.toISOString()
    })
    onOpenChange(false)
  }

  // Format the time value for the time input field
  const getTimeString = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger>
          {children}
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]" aria-describedby="date-description">
          <DrawerDescription className="sr-only">task date settings</DrawerDescription>
          <DrawerHeader className="px-4">
            <DrawerTitle>Set {selectedTab}</DrawerTitle>
          </DrawerHeader>
          <div id="date-description" className="sr-only">
            Select a date and time for the task. You can also set repeat and reminder options.
          </div>
          <TabsPrimitive.Tabs defaultValue="date" onValueChange={(tab) => setSelectedTab(tab)}>
          <TabsPrimitive.TabsList className="grid w-full grid-cols-4">
            <TabsPrimitive.TabsTrigger value="date"><CalendarIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
            <TabsPrimitive.TabsTrigger value="deadline"><Hourglass className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
            <TabsPrimitive.TabsTrigger value="repeat"><RepeatIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
            <TabsPrimitive.TabsTrigger value="reminder"><BellIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
          </TabsPrimitive.TabsList>

          <TabsPrimitive.TabsContent value="date" className="p-3 min-h-[40vh]">
            <div className="space-y-4">
              <div>
                <LabelPrimitive.Label htmlFor="task-date" className="block mb-2">Date</LabelPrimitive.Label>
                <CalendarPrimitive.Calendar
                  mode="single"
                  selected={taskDate}
                  onSelect={handleTaskDateSelect}
                  initialFocus
                />
              </div>
              <div>
                <LabelPrimitive.Label htmlFor="task-time" className="block mb-2">Time</LabelPrimitive.Label>
                <InputPrimitive.Input 
                  id="task-time"
                  type="time"
                  value={getTimeString(taskDate)}
                  onChange={handleTimeChange}
                />
              </div>
            </div>
          </TabsPrimitive.TabsContent>

          <TabsPrimitive.TabsContent value="deadline" className="p-3 space-y-3 min-h-[40vh]">
            <CalendarPrimitive.Calendar
              mode="single"
              selected={deadline}
              onSelect={handleDateSelect}
              initialFocus
            />
          </TabsPrimitive.TabsContent>
          
          <TabsPrimitive.TabsContent value="repeat" className="p-3 min-h-[40vh]">
            <RepeatSettings
              value={task.repeats}
              onChange={(rrule) => {
                updateTask(task.id, { repeats: rrule })
              }}
            />
          </TabsPrimitive.TabsContent>
          <TabsPrimitive.TabsContent value="reminder" className="p-3 space-y-4 min-h-[40vh]">
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
                disabled={!deadline}
             >
                Clear
             </ButtonPrimitive.Button>
        </div>
    </DrawerContent>
    </Drawer>
  )
} 