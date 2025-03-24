"use client"

import { useState, useEffect } from "react"
import type { UserProfile } from "@/types/profile"

// Initial profile data
const initialProfile: UserProfile = {
  name: "John Doe",
  email: "john@example.com",
  bio: "I'm focused on improving my productivity and completing my goals.",
  principles: [
    "The best way to predict the future is to create it.",
    "Small actions compound into remarkable results.",
    "Focus on systems, not goals.",
    "What gets measured gets managed.",
  ],
  inspirations: [],
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const savedProfile = localStorage.getItem("smartTodos-profile")
      return savedProfile ? JSON.parse(savedProfile) : initialProfile
    }
    return initialProfile
  })

  // Save to localStorage whenever profile changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("smartTodos-profile", JSON.stringify(profile))
    }
  }, [profile])

  // Update profile
  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
  }

  // Add a principle
  const addPrinciple = (principle: string) => {
    setProfile((prev) => ({
      ...prev,
      principles: [...prev.principles, principle],
    }))
  }

  // Remove a principle
  const removePrinciple = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      principles: prev.principles.filter((_, i) => i !== index),
    }))
  }

  return {
    profile,
    updateProfile,
    addPrinciple,
    removePrinciple,
  }
}

