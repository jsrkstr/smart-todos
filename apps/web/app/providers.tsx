"use client"

import React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { StoreInitializer } from "@/lib/store/store-initializer"
import { AuthProvider } from "@/contexts/auth-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <StoreInitializer />
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
} 