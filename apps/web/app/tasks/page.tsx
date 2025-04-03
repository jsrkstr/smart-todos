import { AppLayout } from "@/components/layouts/app-layout"
import { TasksList } from "@/components/tasks/tasks-list"

export default function TasksPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <TasksList />
      </div>
    </AppLayout>
  )
}

