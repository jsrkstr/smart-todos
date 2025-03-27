"use client"

import { UserOnboarding } from "@/components/onboarding/user-onboarding"
import React from "react"

export default function OnboardingPage(): React.ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-3xl">
        <UserOnboarding />
      </div>
    </div>
  )
} 