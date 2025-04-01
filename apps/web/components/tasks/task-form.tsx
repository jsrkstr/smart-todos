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
import { useTaskStore } from "@/lib/store/useTaskStore"
import { useToast } from "@/hooks/use-toast"
import type { SubTask, Task, ReminderTimeOption, TaskPriority, TaskStatus, TaskStage, Tag } from "@/types/task"
import { useSettings } from "@/hooks/use-settings"
import { Switch } from "@/components/ui/switch"
import { TagSelect } from "@/components/tags/tag-select"

interface TaskFormProps {
  taskId?: string
  isEditing?: boolean
}

export function TaskForm({ taskId, isEditing = false }: TaskFormProps) {
  const router = useRouter()
  const { tasks, addTask, updateTask, fetchTasks } = useTaskStore()
  const { toast } = useToast()
  const { settings } = useSettings()

  const [title, setTitle] = useState<string>("")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState<string>("09:00")
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [location, setLocation] = useState<string>("")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [why, setWhy] = useState<string>("")
  const [subTasks, setSubTasks] = useState<SubTask[]>([])
  const [newSubTask, setNewSubTask] = useState<string>("")
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState<boolean>(false)
  const [suggestedSubTasks, setSuggestedSubTasks] = useState<SubTask[]>([])
  const [reminderTime, setReminderTime] = useState<ReminderTimeOption>(
    // Default to "at_time" if not set in settings
    (settings.reminderTime || "at_time") as ReminderTimeOption
  )
  const [task, setTask] = useState<Task | null>(null)
  const [isCompleted, setIsCompleted] = useState(task?.completed || false)
  const [stage, setStage] = useState<TaskStage>(task?.stage || "Refinement")
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Fetch task data if editing
  useEffect((): void => {
    if (isEditing && taskId) {
      const existingTask: Task | undefined = tasks.find(t => t.id === taskId)
      if (existingTask) {
        setTask(existingTask)
        setTitle(existingTask.title)
        setPriority(existingTask.priority)
        setLocation(existingTask.location || "")
        setWhy(existingTask.why || "")
        setSubTasks(existingTask.subTasks || [])
        
        // Handle tags
        if (existingTask.tags) {
          setSelectedTags(existingTask.tags)
        }
        
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

        setIsCompleted(existingTask.completed)
        setStage(existingTask.stage)
      }
    }
  }, [isEditing, taskId, tasks])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
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
      try {
        const updatedTask = {
          title,
          date: date ? date.toISOString() : new Date().toISOString(),
          time,
          deadline: deadline ? deadline.toISOString() : undefined,
          priority,
          location: location || undefined,
          why: why || undefined,
          subTasks,
          reminderTime,
          completed: isCompleted,
          stage,
          tags: selectedTags,
        }
        
        await updateTask(taskId, updatedTask)

        toast({
          title: "Success",
          description: "Task updated successfully",
        })
        
        router.push("/tasks")
      } catch (error) {
        console.error('Failed to update task:', error)
        toast({
          title: "Error",
          description: "Failed to update task. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      // Add new task
      try {
        const newTask = {
          id: Date.now().toString(),
          title,
          date: date ? date.toISOString() : new Date().toISOString(),
          time,
          deadline: deadline ? deadline.toISOString() : undefined,
          priority,
          location: location || undefined,
          why: why || undefined,
          subTasks,
          reminderTime,
          dateAdded: new Date().toISOString(),
          completed: isCompleted,
          stage,
          tags: selectedTags,
        }
        
        await addTask(newTask)

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
    }
  }

  const handleAddSubTask = (): void => {
    if (newSubTask.trim()) {
      setSubTasks([...subTasks, { title: newSubTask, status: "new" }])
      setNewSubTask("")
    }
  }

  const handleRemoveSubTask = (index: number): void => {
    setSubTasks(subTasks.filter((_, i) => i !== index))
  }

  const handleAcceptSubTask = (subTask: SubTask): void => {
    setSubTasks([...subTasks, subTask])
    setSuggestedSubTasks(suggestedSubTasks.filter(st => st.title !== subTask.title))
  }

  const handleAcceptAllSubTasks = (): void => {
    setSubTasks([...subTasks, ...suggestedSubTasks])
    setSuggestedSubTasks([])
  }

  const generateSubtasks = async (): Promise<void> => {
    if (!title) {
      toast({
        title: "Error",
        description: "Please enter a task title first",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingSubtasks(true)
    
    try {
      // Call the generate-subtasks API endpoint
      const response = await fetch('/api/generate-subtasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: why // Pass the why field as additional context
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate subtasks')
      }
      
      const data = await response.json()
      
      if (data.subtasks && Array.isArray(data.subtasks)) {
        const generatedSubtasks: SubTask[] = data.subtasks.map((text: string) => ({
          title: text,
          status: "new"
        }))
        
        setSuggestedSubTasks(generatedSubtasks)
        
        toast({
          title: "Success",
          description: `Generated ${generatedSubtasks.length} subtasks`,
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error("Failed to generate subtasks:", error)
      toast({
        title: "Error",
        description: "Failed to generate subtasks. Please try again.",
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

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagSelect
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              placeholder="Select tags..."
            />
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
                  <SelectItem value="five_min_before">5 minutes before</SelectItem>
                  <SelectItem value="fifteen_min_before">15 minutes before</SelectItem>
                  <SelectItem value="thirty_min_before">30 minutes before</SelectItem>
                  <SelectItem value="one_hour_before">1 hour before</SelectItem>
                  <SelectItem value="one_day_before">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select 
                value={stage} 
                onValueChange={(value) => setStage(value as TaskStage)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Refinement">Refinement</SelectItem>
                  <SelectItem value="Breakdown">Breakdown</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Execution">Execution</SelectItem>
                  <SelectItem value="Reflection">Reflection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="completed">Completed</Label>
              <Switch
                checked={isCompleted}
                onCheckedChange={setIsCompleted}
                aria-label="Toggle task completion"
              />
            </div>
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