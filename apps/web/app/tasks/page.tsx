import { AppLayout } from "@/components/layouts/app-layout"
import { TasksList } from "@/components/tasks/tasks-list"
import * as React from "react"

export default function TasksPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <React.Suspense fallback={<div>Loading tasks...</div>}>
          <TasksList />
        </React.Suspense>
      </div>
    </AppLayout>
  )
}

