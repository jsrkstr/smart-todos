"use client"

import { useState, useEffect } from "react"
import type { Reward } from "@/types/reward"

// Initial rewards
const initialRewards: Reward[] = [
  {
    id: "1",
    title: "Coffee Break",
    description: "Take a 15-minute coffee break",
    points: 50,
    frequency: "daily",
    claimed: false,
    dateAdded: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Movie Night",
    description: "Watch your favorite movie",
    points: 200,
    frequency: "weekly",
    claimed: false,
    dateAdded: new Date().toISOString(),
  },
  {
    id: "3",
    title: "New Book",
    description: "Buy a new book you've been wanting to read",
    points: 300,
    frequency: "monthly",
    claimed: true,
    dateAdded: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
  },
]

export function useRewards() {
  const [rewards, setRewards] = useState<Reward[]>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const savedRewards = localStorage.getItem("smartTodos-rewards")
      return savedRewards ? JSON.parse(savedRewards) : initialRewards
    }
    return initialRewards
  })

  // Save to localStorage whenever rewards change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("smartTodos-rewards", JSON.stringify(rewards))
    }
  }, [rewards])

  // Add a new reward
  const addReward = (reward: Reward) => {
    setRewards((prev) => [...prev, reward])
  }

  // Claim a reward
  const claimReward = (rewardId: string) => {
    setRewards((prev) => prev.map((reward) => (reward.id === rewardId ? { ...reward, claimed: true } : reward)))
  }

  // Delete a reward
  const deleteReward = (rewardId: string) => {
    setRewards((prev) => prev.filter((reward) => reward.id !== rewardId))
  }

  return {
    rewards,
    addReward,
    claimReward,
    deleteReward,
  }
}

