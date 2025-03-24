"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarIcon, MapPin, Plus, Trash2 } from "lucide-react"
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
import type { SubTask } from "@/types/task"

export function AddTaskForm() {
  const router = useRouter()
  const { addTask } = useTasks()

  const [title, setTitle] = useState("")
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [location, setLocation] = useState("")
  const [priority, setPriority] = useState("medium")
  const [why, setWhy] = useState("")
  const [subTasks, setSubTasks] = useState<SubTask[]>([])
  const [newSubTask, setNewSubTask] = useState("")

  const handleAddSubTask = () => {
    if (newSubTask.trim()) {
      setSubTasks([...subTasks, { title: newSubTask, completed: false }])
      setNewSubTask("")
    }
  }

  const handleRemoveSubTask = (index: number) => {
    setSubTasks(subTasks.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const newTask = {
      id: Date.now().toString(),
      title,
      deadline: deadline?.toISOString() || new Date().toISOString(),
      dateAdded: new Date().toISOString(),
      completed: false,
      priority,
      location,
      why,
      subTasks,
    }

    addTask(newTask)
    router.push("/")
  }

  return (
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
                    className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}
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

