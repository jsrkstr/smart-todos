import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { TasksList } from "@/components/tasks/tasks-list"

export default function TasksPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">My Tasks</h1>
        <TasksList />
      </div>
    </DashboardLayout>
  )
}

