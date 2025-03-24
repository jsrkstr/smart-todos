import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { TasksOverview } from "@/components/tasks/tasks-overview"

export default function Home() {
  return (
    <DashboardLayout>
      <TasksOverview />
    </DashboardLayout>
  )
}

