"use client"

import * as React from "react"
import { useTasks } from "@/hooks/use-tasks"
import type { Tag, Task } from "@/types/task"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/drawer"
import { ScrollArea } from "@radix-ui/react-scroll-area"
import { Input } from "../ui/input"
import { useTagStore } from "@/lib/store/useTagStore"
import { Checkbox } from "../ui/checkbox"

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
  const [selectedTags, setSelectedTags] = React.useState<Tag[]>(task.tags || [])

  React.useEffect(() => {
    // Reset tags when task changes or picker opens
    setSelectedTags(task.tags || [])
  }, [task.tags, open])

  const handleTagsChange = (newTags: Tag[]) => {
    setSelectedTags(newTags)
    updateTask(task.id, { tags: newTags })
  }

  const { tags, categories, loading, fetchTags } = useTagStore()
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    fetchTags()
  }, [fetchTags])

  // Filter tags based on search term
  const filteredTags = React.useMemo(() => {
    return tags.filter(tag =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [tags, searchTerm])

  // Group tags by category
  const groupedTags = React.useMemo(() => {
    return filteredTags.reduce((acc, tag) => {
      const categoryId = tag.categoryId || 'uncategorized'
      if (!acc[categoryId]) {
        acc[categoryId] = []
      }
      acc[categoryId].push(tag)
      return acc
    }, {} as Record<string, Tag[]>)
  }, [filteredTags])

  // Find category name by id
  const getCategoryName = (categoryId: string) => {
    if (categoryId === 'uncategorized') return 'Uncategorized'
    const category = categories.find(c => c.id === categoryId)
    return category ? category.name : 'Uncategorized'
  }

  // Handle tag selection
  const handleTagSelect = (tag: Tag) => {
    if (selectedTags.some(t => t.id === tag.id)) {
      handleTagsChange(selectedTags.filter(t => t.id !== tag.id))
    } else {
      handleTagsChange([...selectedTags, tag])
    }
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger>
          {children}
        </DrawerTrigger>
        <DrawerContent className="max-h-[60vh]">
          <DrawerHeader className="px-4">
            <DrawerTitle>Select Tags</DrawerTitle>
            <div className="mt-4">
              <Input
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 pb-6" style={{ overflow: "scroll"}}>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading tags...
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No tags found.
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedTags).map(([categoryId, categoryTags]) => (
                  <div key={categoryId} className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {getCategoryName(categoryId)}
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {categoryTags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center space-x-2 rounded-md border p-2"
                        >
                          <label
                            htmlFor={`tag-${tag.id}`}
                            className="flex flex-1 items-center gap-2 text-sm"
                          >
                            <span className="truncate">{tag.name}</span>
                          </label>

                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={selectedTags.some(t => t.id === tag.id)}
                            onCheckedChange={() => handleTagSelect(tag)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  )
} 