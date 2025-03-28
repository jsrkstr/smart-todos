"use client"

import { UserOnboarding } from "@/components/onboarding/user-onboarding"
import React from "react"

export default function OnboardingPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <UserOnboarding />
        </div>
      </div>
    </div>
  )
} 