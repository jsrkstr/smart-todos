"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Tag } from "@/types/task"
import { X } from "lucide-react"

interface TagBadgeProps {
  tag: Tag
  onRemove?: () => void
  className?: string
}

export function TagBadge({ tag, onRemove, className }: TagBadgeProps) {
  return (
    <Badge 
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 mr-1 mb-1", 
        className
      )}
      style={{ backgroundColor: tag.color }}
    >
      <span className="text-white truncate max-w-32">{tag.name}</span>
      {onRemove && (
        <X 
          size={14} 
          className="cursor-pointer text-white hover:text-gray-200" 
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        />
      )}
    </Badge>
  )
} 