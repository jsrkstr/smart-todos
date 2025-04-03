"use client"

import * as React from "react"
import { TagIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/use-tasks"
import type { Task, Tag as TaskTag } from "@/types/task"

import * as PopoverPrimitive from "@/components/ui/popover"
import * as ButtonPrimitive from "@/components/ui/button"
import * as CheckboxPrimitive from "@/components/ui/checkbox"
import * as LabelPrimitive from "@/components/ui/label"
import * as BadgePrimitive from "@/components/ui/badge"
import * as InputPrimitive from "@/components/ui/input"

// Placeholder tags - replace with actual tag data source
const availableTags: TaskTag[] = [
  { name: "Work", color: "#ef4444" },
  { name: "Personal", color: "#3b82f6" },
  { name: "Urgent", color: "#f97316" },
  { name: "Study", color: "#8b5cf6" },
]

interface TagPickerProps {
  task: Task
  children: React.ReactNode // Trigger element
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TagPicker({
  task,
  children,
  open,
  onOpenChange,
}: TagPickerProps) {
  const { updateTask } = useTasks()
  const [selectedTags, setSelectedTags] = React.useState<TaskTag[]>(task.tags || [])
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    // Reset tags when task changes or picker opens
    setSelectedTags(task.tags || [])
    setSearchTerm("")
  }, [task.tags, open])

  const handleTagToggle = (tag: TaskTag) => {
    const isSelected = selectedTags.some(t => t.name === tag.name)
    let newTags: TaskTag[]
    if (isSelected) {
      newTags = selectedTags.filter(t => t.name !== tag.name)
    } else {
      newTags = [...selectedTags, tag]
    }
    setSelectedTags(newTags)
    updateTask(task.id, { tags: newTags })
  }

  const filteredTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <PopoverPrimitive.Popover open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.PopoverTrigger asChild>
        {children}
      </PopoverPrimitive.PopoverTrigger>
      <PopoverPrimitive.PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 border-b">
          <InputPrimitive.Input 
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="p-3 max-h-48 overflow-y-auto">
          {filteredTags.length > 0 ? (
            <div className="space-y-2">
              {filteredTags.map((tag) => (
                <div key={tag.name} className="flex items-center justify-between">
                   <LabelPrimitive.Label 
                     htmlFor={`tag-${tag.name}`} 
                     className="flex items-center gap-2 cursor-pointer"
                    >
                    <BadgePrimitive.Badge 
                        variant="outline"
                        className="py-0 px-1.5"
                        style={{ borderColor: tag.color, color: tag.color }}
                     >
                      {tag.name}
                    </BadgePrimitive.Badge>
                  </LabelPrimitive.Label>
                  <CheckboxPrimitive.Checkbox
                    id={`tag-${tag.name}`}
                    checked={selectedTags.some(t => t.name === tag.name)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">No tags found.</p>
          )}
        </div>
        {/* Add functionality for creating new tags if needed */}
      </PopoverPrimitive.PopoverContent>
    </PopoverPrimitive.Popover>
  )
} 