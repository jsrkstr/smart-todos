"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const inspirationalPeople = [
  {
    id: 1,
    name: "James Clear",
    role: "Author of Atomic Habits",
    image: "/placeholder.svg?height=80&width=80",
    principles: [
      "Small habits compound over time.",
      "Focus on systems, not goals.",
      "Make it obvious, attractive, easy, and satisfying.",
    ],
  },
  {
    id: 2,
    name: "Steve Jobs",
    role: "Co-founder of Apple",
    image: "/placeholder.svg?height=80&width=80",
    principles: [
      "Stay hungry, stay foolish.",
      "Focus is about saying no.",
      "Design is not just what it looks like, it's how it works.",
    ],
  },
  {
    id: 3,
    name: "Naval Ravikant",
    role: "Entrepreneur & Investor",
    image: "/placeholder.svg?height=80&width=80",
    principles: [
      "Seek wealth, not money or status.",
      "Learn to sell, learn to build.",
      "Specific knowledge is knowledge you cannot be trained for.",
    ],
  },
  {
    id: 4,
    name: "Mahatma Gandhi",
    role: "Leader & Activist",
    image: "/placeholder.svg?height=80&width=80",
    principles: [
      "Be the change you wish to see in the world.",
      "Strength does not come from physical capacity.",
      "The future depends on what we do in the present.",
    ],
  },
  {
    id: 5,
    name: "Elon Musk",
    role: "Entrepreneur & Innovator",
    image: "/placeholder.svg?height=80&width=80",
    principles: [
      "When something is important enough, you do it even if the odds are not in your favor.",
      "Constantly think about how you could be doing things better.",
      "Failure is an option here. If things are not failing, you are not innovating enough.",
    ],
  },
]

export function InspirationList() {
  const [selectedPerson, setSelectedPerson] = useState(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {inspirationalPeople.map((person) => (
        <Card key={person.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={person.image} alt={person.name} />
                <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">{person.name}</h4>
                <p className="text-sm text-muted-foreground">{person.role}</p>
              </div>
            </div>
            <div className="border-t px-4 py-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" onClick={() => setSelectedPerson(person)}>
                    View Principles
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{person.name}'s Principles</DialogTitle>
                    <DialogDescription>Principles that can inspire your productivity</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {person.principles.map((principle, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary rounded-full h-6 w-6 flex items-center justify-center shrink-0">
                          {index + 1}
                        </div>
                        <p>{principle}</p>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

