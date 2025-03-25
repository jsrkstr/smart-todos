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
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    // Load profile from API
    async function loadProfile() {
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) {
          throw new Error('Failed to load profile')
        }
        const data = await response.json()
        setProfile(data)
      } catch (error) {
        console.error("Failed to load profile:", error)
        // Fallback to initial profile if API call fails
        setProfile(initialProfile)
      }
    }
    loadProfile()
  }, [])

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error("Failed to update profile:", error)
    }
  }

  // Add a principle
  const addPrinciple = async (principle: string) => {
    try {
      const response = await fetch('/api/profile/principles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principle }),
      })
      if (!response.ok) {
        throw new Error('Failed to add principle')
      }
      const data = await response.json()
      setProfile(prev => prev ? { ...prev, principles: data.principles } : null)
    } catch (error) {
      console.error("Failed to add principle:", error)
    }
  }

  // Remove a principle
  const removePrinciple = async (index: number) => {
    try {
      const response = await fetch('/api/profile/principles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      })
      if (!response.ok) {
        throw new Error('Failed to remove principle')
      }
      const data = await response.json()
      setProfile(prev => prev ? { ...prev, principles: data.principles } : null)
    } catch (error) {
      console.error("Failed to remove principle:", error)
    }
  }

  return {
    profile,
    updateProfile,
    addPrinciple,
    removePrinciple,
  }
}

