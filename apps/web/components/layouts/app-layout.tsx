"use client"

import type React from "react"

import { Header } from "@/components/ui/header"
import { Sidebar } from "@/components/ui/sidebar"
import { useState } from "react"
import { ProtectedLayout } from "./protected-layout"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ProtectedLayout>
      <div className="flex h-screen overflow-hidden">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-col flex-1 overflow-y-auto">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 pb-8 px-8">{children}</main>
        </div>
      </div>
    </ProtectedLayout>
  )
}

