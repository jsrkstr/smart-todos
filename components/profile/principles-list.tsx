"use client"

import { Quote, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProfile } from "@/hooks/use-profile"

interface PrinciplesListProps {
  principles: string[]
}

export function PrinciplesList({ principles }: PrinciplesListProps) {
  const { removePrinciple } = useProfile()

  if (principles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Quote className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No principles added yet. Add some principles that motivate you!</p>
        <p className="text-sm mt-2">
          Try principles from authors like Naval Ravikant, Steve Jobs, or from books like Atomic Habits.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {principles.map((principle, index) => (
        <div key={index} className="flex items-start gap-3 p-3 rounded-md border bg-card">
          <Quote className="h-5 w-5 mt-0.5 text-primary shrink-0" />
          <p className="flex-1 text-sm">{principle}</p>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removePrinciple(index)}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove principle</span>
          </Button>
        </div>
      ))}
    </div>
  )
}

