"use client"

import type React from "react"

import { Header } from "@/components/ui/header"
import { Sidebar } from "@/components/ui/sidebar"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { StoreInitializer } from "@/lib/store/store-initializer"
import { PomodoroTimerProvider } from "../pomodoro/pomodoro-context"

interface AppLayoutProps {
  children: React.ReactNode
}

const formatPageName = (pathname: string | null): string => {
  if (!pathname) return "Dashboard";
  // Remove leading slash and split by '/'
  const parts = pathname.slice(1).split('/');
  // Get the last part of the path
  const pageName = parts[parts.length - 1];
  // If it's the root path, return "Dashboard"
  if (!pageName) return "Dashboard";
  // Capitalize first letter and add spaces before capital letters
  return pageName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname();
  const currentPage = formatPageName(pathname);

  return (
    <div className="flex h-screen overflow-hidden">
      <StoreInitializer />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-y-auto">
        <PomodoroTimerProvider>
          <Header onMenuClick={() => setSidebarOpen(true)} currentPage={currentPage} />
          <main className="flex-1 pb-8 px-6 lg:px-8">{children}</main>
        </PomodoroTimerProvider>
      </div>
    </div>
  )
}

