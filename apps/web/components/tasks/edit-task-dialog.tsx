"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarIcon, Clock, MapPin, Trash2, Plus } from "lucide-react"
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
import type { Task } from "@/types/task"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface EditTaskDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps): JSX.Element {
  const router = useRouter()
  const { updateTask, deleteTask } = useTasks()

  const [title, setTitle] = useState<string>(task.title)
  const [deadline, setDeadline] = useState<Date | undefined>(task.deadline ? new Date(task.deadline) : undefined)
  const [time, setTime] = useState<string>(task.time || "09:00") // Default time
  const [location, setLocation] = useState<string>(task.location || "")
  const [priority, setPriority] = useState<"low" | "medium" | "high">(task.priority)
  const [why, setWhy] = useState<string>(task.why || "")
  const [children, setChildren] = useState<Task[]>(task.children || [])
  const [newSubTask, setNewSubTask] = useState<string>("")

  const handleAddSubTask = (): void => {
    if (newSubTask.trim()) {
      // Create a simplified Task object for the child task
      setChildren([...children, { 
        id: `temp-${Date.now().toString()}`, // temporary ID for UI
        title: newSubTask,
        date: task.date, // Inherit date from parent
        dateAdded: new Date().toISOString(),
        completed: false,
        stage: task.stage,
        priority: priority
      }])
      setNewSubTask("")
    }
  }

  const handleRemoveSubTask = (index: number): void => {
    setChildren(children.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()

    if (!title.trim()) return

    const updatedTask: Partial<Task> = {
      title,
      deadline: deadline?.toISOString() || new Date().toISOString(),
      time,
      priority,
      location,
      why,
      children,
    }

    updateTask(task.id, updatedTask)
    onOpenChange(false)
    router.refresh()
  }

  // Generate time options
  const generateTimeOptions = (): string[] => {
    const options: string[] = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour: string = hour.toString().padStart(2, "0")
        const formattedMinute: string = minute.toString().padStart(2, "0")
        options.push(`${formattedHour}:${formattedMinute}`)
      }
    }
    return options
  }

  const timeOptions: string[] = generateTimeOptions()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Make changes to your task here. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="What do you need to do?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !deadline && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? format(deadline, "PPP") : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
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
                  <Select 
                    defaultValue={priority} 
                    onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}
                  >
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

                {children.length > 0 && (
                  <div className="space-y-2">
                    {children.map((child, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-md border p-2">
                        <span className="flex-1 text-sm">{child.title}</span>
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

              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

