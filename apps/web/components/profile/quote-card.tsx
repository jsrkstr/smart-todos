"use client"

import { type FC } from "react"
import { Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useProfile } from "@/hooks/use-profile"

export const QuoteCard: FC = () => {
  const { profile } = useProfile()

  // Get a random principle to display
  const getRandomPrinciple = () => {
    if (!profile || !profile.principles || profile.principles.length === 0) {
      return "Add principles in your profile to see motivational quotes here!"
    }
    const randomIndex = Math.floor(Math.random() * profile.principles.length)
    return profile.principles[randomIndex]
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <Quote className="h-8 w-8 text-primary mb-4" />
          <p className="text-lg font-medium italic">{getRandomPrinciple()}</p>
        </div>
      </CardContent>
    </Card>
  )
}

