"use client"

import { useState, useEffect, useCallback } from "react"
import type { UserProfile } from "@/types/profile"

interface ProfileHookReturn {
  profile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile> | any) => Promise<void>;
  addPrinciple: (principle: string) => Promise<void>;
  removePrinciple: (index: number) => Promise<void>;
}

export function useProfile(): ProfileHookReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    // Load profile from API
    async function loadProfile(): Promise<void> {
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) {
          console.warn('Failed to load profile, using default profile')
          return
        }
        const data: UserProfile = await response.json()
        setProfile(data)
      } catch (error) {
        console.error("Failed to load profile:", error)
      }
    }
    loadProfile()
  }, [])

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile> | any): Promise<void> => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      const data: UserProfile = await response.json()
      setProfile(data)
    } catch (error) {
      console.error("Failed to update profile:", error)
    }
  }, [])

  // Add a principle
  const addPrinciple = async (principle: string): Promise<void> => {
    try {
      const response = await fetch('/api/profile/principles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principle }),
      })
      if (!response.ok) {
        throw new Error('Failed to add principle')
      }
      const data: { principles: string[] } = await response.json()
      setProfile(prev => prev ? { ...prev, principles: data.principles } : null)
    } catch (error) {
      console.error("Failed to add principle:", error)
    }
  }

  // Remove a principle
  const removePrinciple = async (index: number): Promise<void> => {
    try {
      const response = await fetch('/api/profile/principles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      })
      if (!response.ok) {
        throw new Error('Failed to remove principle')
      }
      const data: { principles: string[] } = await response.json()
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

