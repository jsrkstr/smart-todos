"use client"

import { useState, useRef, useEffect } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Plus, Tag as TagIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTagStore } from "@/lib/store/useTagStore"
import { TagBadge } from "./tag-badge"
import { TagDialog } from "./tag-dialog"
import type { Tag, TagCategory } from "@/types/task"

interface TagSelectProps {
  selectedTags: Tag[]
  onChange: (tags: Tag[]) => void
  placeholder?: string
}

export function TagSelect({ selectedTags, onChange, placeholder = "Select tags..." }: TagSelectProps) {
  const { tags, categories, loading, fetchTags } = useTagStore()
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  useEffect(() => {
    fetchTags()
  }, [fetchTags])
  
  // Group tags by category
  const groupedTags = tags.reduce((acc, tag) => {
    const categoryId = tag.categoryId || 'uncategorized'
    if (!acc[categoryId]) {
      acc[categoryId] = []
    }
    acc[categoryId].push(tag)
    return acc
  }, {} as Record<string, Tag[]>)

  // Handle tag selection
  const handleTagSelect = (tag: Tag) => {
    if (selectedTags.some(t => t.id === tag.id)) {
      onChange(selectedTags.filter(t => t.id !== tag.id))
    } else {
      onChange([...selectedTags, tag])
    }
  }

  // Handle tag removal
  const handleTagRemove = (tagId: string) => {
    onChange(selectedTags.filter(t => t.id !== tagId))
  }

  // Find category name by id
  const getCategoryName = (categoryId: string) => {
    if (categoryId === 'uncategorized') return 'Uncategorized'
    const category = categories.find(c => c.id === categoryId)
    return category ? category.name : 'Uncategorized'
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 min-h-[28px] mb-1">
        {selectedTags.map(tag => (
          <TagBadge 
            key={tag.id} 
            tag={tag} 
            onRemove={() => handleTagRemove(tag.id as string)} 
          />
        ))}
      </div>
      
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[300px]" align="start">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                {loading ? (
                  <div className="py-6 text-center text-sm">Loading tags...</div>
                ) : (
                  Object.entries(groupedTags).map(([categoryId, categoryTags]) => (
                    <CommandGroup key={categoryId} heading={getCategoryName(categoryId)}>
                      {categoryTags.map(tag => (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => {
                            handleTagSelect(tag)
                            // Keep open for multi-select
                          }}
                        >
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span>{tag.name}</span>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedTags.some(t => t.id === tag.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))
                )}
              </CommandList>
              <div className="p-1 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    setOpen(false)
                    setDialogOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add new tag
                </Button>
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <TagDialog
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onTagCreated={(newTag) => {
          onChange([...selectedTags, newTag])
        }}
      />
    </div>
  )
} 