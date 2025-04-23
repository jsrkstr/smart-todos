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
  const [taskDate, setTaskDate] = React.useState<Date | undefined>(task.date ? new Date(task.date) : undefined)
  const [dateMonth, setDateMonth] = React.useState<Date>(taskDate || new Date())
  const [deadlineMonth, setDeadlineMonth] = React.useState<Date>(deadline || new Date())
  const [selectedTab, setSelectedTab] = React.useState<string>('Due date')



  React.useEffect(() => {
    // Reset date/time when task changes or picker opens
    setDeadline(task.deadline ? new Date(task.deadline) : undefined)
    setTaskDate(new Date(task.date))

    if (task.date) {
      setDateMonth(new Date(task.date));
    }
    if (task.deadline) {
      setDeadlineMonth(new Date(task.deadline));
    }

  }, [task.deadline, task.date, open])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDeadline(selectedDate)
    updateTask(task.id, { deadline: selectedDate?.toISOString() })
    // Potentially close popover or move to time tab
  }

  const handleTaskDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Preserve the time from the current taskDate
      const currentTaskDate = taskDate ? new Date(taskDate) : new Date();
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
      const newDate = taskDate ? new Date(taskDate) : new Date();
      newDate.setHours(hours)
      newDate.setMinutes(minutes)

      setTaskDate(newDate)
      updateTask(task.id, { date: newDate.toISOString() })
    }
  }

  const handleClear = () => {
    setDeadline(undefined)
    setTaskDate(undefined)
    updateTask(task.id, {
      deadline: undefined,
      date: undefined,
      repeats: undefined,
    })
    onOpenChange(false)
  }

  // Format the time value for the time input field
  const getTimeString = (date: Date) => {
    if (!date) return '00:00';
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
        <TabsPrimitive.Tabs defaultValue="Due date" onValueChange={(tab) => setSelectedTab(tab)}>
          <TabsPrimitive.TabsList className="grid w-full grid-cols-4">
            <TabsPrimitive.TabsTrigger value="Date"><CalendarIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
            <TabsPrimitive.TabsTrigger value="Due date"><Hourglass className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
            <TabsPrimitive.TabsTrigger value="Repeat"><RepeatIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
            <TabsPrimitive.TabsTrigger value="Reminders"><BellIcon className="h-4 w-4" /></TabsPrimitive.TabsTrigger>
          </TabsPrimitive.TabsList>

          <TabsPrimitive.TabsContent value="Date" className="p-3 min-h-[40vh]">
            <div className="flex">
              <div>
                <LabelPrimitive.Label htmlFor="task-date" className="block mb-2">Date</LabelPrimitive.Label>
                <CalendarPrimitive.Calendar
                  mode="single"
                  selected={taskDate}
                  onSelect={handleTaskDateSelect}
                  month={dateMonth}
                  onMonthChange={setDateMonth}
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

          <TabsPrimitive.TabsContent value="Due date" className="p-3 space-y-3 min-h-[40vh]">
            <div className="flex">
              <div>
                <LabelPrimitive.Label htmlFor="task-date" className="block mb-2">Due date</LabelPrimitive.Label>
                <CalendarPrimitive.Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={handleDateSelect}
                  month={deadlineMonth}
                  onMonthChange={setDeadlineMonth}
                  initialFocus
                />
              </div>
              <div>
                <LabelPrimitive.Label htmlFor="quick-select" className="block mb-2">Quick select</LabelPrimitive.Label>
                <div id="quick-select" className="space-y-2">
                  <ButtonPrimitive.Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date();
                      handleDateSelect(date);
                    }}
                  >
                    Today
                  </ButtonPrimitive.Button>
                  <ButtonPrimitive.Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 1);
                      handleDateSelect(date);
                    }}
                  >
                    Tomorrow
                  </ButtonPrimitive.Button>
                  <ButtonPrimitive.Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date();
                      const day = date.getDay();
                      const daysUntilEndOfWeek = 7 - day;
                      date.setDate(date.getDate() + daysUntilEndOfWeek); // End of this week
                      handleDateSelect(date);
                    }}
                  >
                    This week
                  </ButtonPrimitive.Button>
                  <ButtonPrimitive.Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 7); // 1 week
                      handleDateSelect(date);
                    }}
                  >
                    1 week
                  </ButtonPrimitive.Button>
                  <ButtonPrimitive.Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 14); // 2 weeks
                      handleDateSelect(date);
                    }}
                  >
                    2 weeks
                  </ButtonPrimitive.Button>
                  <ButtonPrimitive.Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date();
                      date.setMonth(date.getMonth() + 1); // 1 month
                      handleDateSelect(date);
                    }}
                  >
                    1 month
                  </ButtonPrimitive.Button>
                  <ButtonPrimitive.Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date();
                      date.setMonth(date.getMonth() + 3); // 3 months
                      handleDateSelect(date);
                    }}
                  >
                    3 months
                  </ButtonPrimitive.Button>
                </div>
              </div>
            </div>
          </TabsPrimitive.TabsContent>

          <TabsPrimitive.TabsContent value="Repeat" className="p-3 min-h-[40vh]">
            <RepeatSettings
              value={task.repeats}
              onChange={(rrule) => {
                updateTask(task.id, { repeats: rrule })
              }}
            />
          </TabsPrimitive.TabsContent>
          <TabsPrimitive.TabsContent value="Reminders" className="p-3 space-y-4 min-h-[40vh]">
            <ReminderSettings value={task.notifications} onChange={(value: Notification[]) => {
              updateTask(task.id, { notifications: value })
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