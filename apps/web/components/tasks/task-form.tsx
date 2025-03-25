"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import type { SubTask, Task, ReminderTimeOption } from "@/types/task"
import { useSettings } from "@/hooks/use-settings"

interface TaskFormProps {
  taskId?: string
  isEditing?: boolean
}

export function TaskForm({ taskId, isEditing = false }: TaskFormProps) {
  const router = useRouter()
  const { tasks, addTask, updateTask } = useTasks()
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
  const [reminderTime, setReminderTime] = useState<ReminderTimeOption>(
    // Make sure we have a valid enum value
    ((settings.reminderTime as ReminderTimeOption) || "at_time") as ReminderTimeOption
  )
  const [task, setTask] = useState<Task | null>(null)

  // Fetch task data if editing
  useEffect(() => {
    if (isEditing && taskId) {
      const existingTask = tasks.find(t => t.id === taskId) || null
      if (existingTask) {
        setTask(existingTask)
        setTitle(existingTask.title)
        setPriority(existingTask.priority)
        setLocation(existingTask.location || "")
        setWhy(existingTask.why || "")
        setSubTasks(existingTask.subTasks || [])
        
        // Handle date
        if (existingTask.date) {
          setDate(new Date(existingTask.date))
        }
        
        // Handle time
        if (existingTask.time) {
          setTime(existingTask.time)
        }
        
        // Handle deadline
        if (existingTask.deadline) {
          setDeadline(new Date(existingTask.deadline))
        }
        
        // Handle reminder time
        if (existingTask.reminderTime) {
          setReminderTime(existingTask.reminderTime as ReminderTimeOption)
        }
      }
    }
  }, [isEditing, taskId, tasks])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      })
      return
    }

    if (isEditing && taskId && task) {
      // Update existing task
      updateTask(taskId, {
        title,
        date: date ? date.toISOString() : new Date().toISOString(),
        time,
        deadline: deadline ? deadline.toISOString() : undefined,
        priority: priority as "low" | "medium" | "high",
        location: location || undefined,
        why: why || undefined,
        subTasks,
        reminderTime,
      })

      toast({
        title: "Success",
        description: "Task updated successfully",
      })
    } else {
      // Add new task
      try {
        addTask({
          id: Date.now().toString(),
          title,
          date: date ? date.toISOString() : new Date().toISOString(),
          time,
          deadline: deadline ? deadline.toISOString() : undefined,
          priority: priority as "low" | "medium" | "high",
          location: location || undefined,
          why: why || undefined,
          subTasks,
          reminderTime,
          dateAdded: new Date().toISOString(),
          completed: false
        })

        toast({
          title: "Success",
          description: "Task added successfully",
        })
        
        router.push("/tasks")
      } catch (error) {
        console.error('Failed to add task:', error)
        toast({
          title: "Error",
          description: "Failed to add task. Please try again.",
          variant: "destructive",
        })
      }
      return
    }

    router.push("/tasks")
  }

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
    if (!title) return

    setIsGeneratingSubtasks(true)
    
    try {
      // Make API call here to generate subtasks with AI
      // For demonstration purposes, let's create some dummy subtasks
      const dummySubtasks: SubTask[] = [
        { title: `Research for "${title}"`, completed: false },
        { title: `Draft initial "${title}" plan`, completed: false },
        { title: `Review "${title}" progress`, completed: false },
      ]
      
      setSuggestedSubTasks(dummySubtasks)
    } catch (error) {
      console.error("Failed to generate subtasks:", error)
      toast({
        title: "Error",
        description: "Failed to generate subtasks",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingSubtasks(false)
    }
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

  if (isEditing && !task) {
    return <div>Loading...</div>
  }

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Select defaultValue={time} onValueChange={(value) => setTime(value)}>
                  <SelectTrigger id="time" className="pl-9">
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
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
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Select a deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderTime">Reminder Time</Label>
              <Select value={reminderTime} onValueChange={(value) => setReminderTime(value as ReminderTimeOption)}>
                <SelectTrigger id="reminderTime">
                  <SelectValue placeholder="When to remind" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="at_time">At time of task</SelectItem>
                  <SelectItem value="5_minutes">5 minutes before</SelectItem>
                  <SelectItem value="10_minutes">10 minutes before</SelectItem>
                  <SelectItem value="15_minutes">15 minutes before</SelectItem>
                  <SelectItem value="30_minutes">30 minutes before</SelectItem>
                  <SelectItem value="1_hour">1 hour before</SelectItem>
                  <SelectItem value="2_hours">2 hours before</SelectItem>
                  <SelectItem value="1_day">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value)}>
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

            {suggestedSubTasks.length > 0 && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Suggested Subtasks</h3>
                  <Button type="button" variant="link" size="sm" onClick={handleAcceptAllSubTasks}>
                    Accept All
                  </Button>
                </div>
                <div className="space-y-2">
                  {suggestedSubTasks.map((subTask, index) => (
                    <div key={index} className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm">{subTask.title}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleAcceptSubTask(subTask)}>
                        Accept
                      </Button>
                    </div>
                  ))}
                </div>
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
            <Button type="submit">{isEditing ? "Save Changes" : "Add Task"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 