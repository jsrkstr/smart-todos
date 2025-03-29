"use client";

import React, { useState } from "react";
import { Header } from "@/components/ui/header";
import { Sidebar } from "@/components/ui/sidebar";
import { ProtectedLayout } from "@/components/layouts/protected-layout";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedLayout>
      <div className="flex h-screen overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-auto bg-muted/40 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedLayout>
  );
} 