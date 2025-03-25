"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarIcon, Clock, MapPin, Plus, Trash2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useTasks } from "@/hooks/use-tasks"
import { useToast } from "@/hooks/use-toast"
import type { SubTask } from "@/types/task"
import { useSettings } from "@/hooks/use-settings"

export function AddTaskForm() {
  const router = useRouter()
  const { addTask } = useTasks()
  const { toast } = useToast()
  const { settings } = useSettings()

  const [title, setTitle] = useState("")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState("09:00")
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [location, setLocation] = useState("")
  const [priority, setPriority] = useState("medium")
  const [why, setWhy] = useState("")
  const [subTasks, setSubTasks] = useState<SubTask[]>([])
  const [newSubTask, setNewSubTask] = useState("")
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false)
  const [suggestedSubTasks, setSuggestedSubTasks] = useState<SubTask[]>([])
  const [reminderTime, setReminderTime] = useState(settings.reminderTime)

  const handleAddSubTask = () => {
    if (newSubTask.trim()) {
      setSubTasks([...subTasks, { title: newSubTask, completed: false }])
      setNewSubTask("")
    }
  }

  const handleRemoveSubTask = (index: number) => {
    setSubTasks(subTasks.filter((_, i) => i !== index))
  }

  const handleAcceptSubTask = (subTask: SubTask) => {
    setSubTasks([...subTasks, subTask])
    setSuggestedSubTasks(suggestedSubTasks.filter(st => st.title !== subTask.title))
  }

  const handleAcceptAllSubTasks = () => {
    setSubTasks([...subTasks, ...suggestedSubTasks])
    setSuggestedSubTasks([])
  }

  const generateSubtasks = async () => {
    if (!title.trim()) {
      toast({
        title: "Task title required",
        description: "Please enter a task title to generate subtasks.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingSubtasks(true)

    try {
      const response = await fetch('/api/generate-subtasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: why,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate subtasks')
      }

      const { subtasks } = await response.json()
      setSuggestedSubTasks(subtasks.map((title: string) => ({ title, completed: false })))

      toast({
        title: "Subtasks generated",
        description: "AI-generated subtasks are ready for review.",
      })
    } catch (error) {
      toast({
        title: "Failed to generate subtasks",
        description: "An error occurred while generating subtasks.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingSubtasks(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !date) return

    const newTask = {
      id: Date.now().toString(),
      title,
      date: date.toISOString(),
      time,
      deadline: deadline?.toISOString(),
      dateAdded: new Date().toISOString(),
      completed: false,
      priority,
      location,
      why,
      subTasks,
      reminderTime: reminderTime ? new Date(date.setMinutes(date.getMinutes() - parseInt(reminderTime))).toISOString() : undefined,
    }

    addTask(newTask)
    toast({
      title: "Task added",
      description: "Your new task has been added successfully.",
    })
    router.push("/")
  }

  // Generate time options
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, "0")
        const formattedMinute = minute.toString().padStart(2, "0")
        options.push(`${formattedHour}:${formattedMinute}`)
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <div className="flex gap-2">
              <Input
                id="title"
                placeholder="What do you need to do?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generateSubtasks}
                disabled={isGeneratingSubtasks}
                title="Generate subtasks with AI"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {suggestedSubTasks.length > 0 && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Suggested Subtasks</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSuggestedSubTasks([])}>
                    Discard All
                  </Button>
                  <Button size="sm" onClick={handleAcceptAllSubTasks}>
                    Accept All
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {suggestedSubTasks.map((subTask, index) => (
                  <div key={index} className="flex items-center gap-2 rounded-md border p-2 bg-background">
                    <span className="flex-1 text-sm">{subTask.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAcceptSubTask(subTask)}
                    >
                      Accept
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger id="time" className="pl-9">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select defaultValue="medium" onValueChange={(value) => setPriority(value)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  className="pl-9"
                  placeholder="Where will you complete this task?"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Select a deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder">Reminder Time</Label>
              <Select value={reminderTime} onValueChange={setReminderTime}>
                <SelectTrigger id="reminder">
                  <SelectValue placeholder="Select reminder time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="120">2 hours before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Subtasks</Label>

            <div className="flex gap-2">
              <Input
                placeholder="Add a subtask"
                value={newSubTask}
                onChange={(e) => setNewSubTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddSubTask()
                  }
                }}
              />
              <Button type="button" onClick={handleAddSubTask} size="icon" variant="secondary">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add subtask</span>
              </Button>
            </div>

            {subTasks.length > 0 && (
              <div className="space-y-2">
                {subTasks.map((subTask, index) => (
                  <div key={index} className="flex items-center gap-2 rounded-md border p-2">
                    <span className="flex-1 text-sm">{subTask.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveSubTask(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove subtask</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="why">Why is this task important? (Simon Sinek's Golden Circle)</Label>
            <Textarea
              id="why"
              placeholder="Understanding your 'why' increases motivation..."
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

