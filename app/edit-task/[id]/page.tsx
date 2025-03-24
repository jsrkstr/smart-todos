import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { EditTaskForm } from "@/components/tasks/edit-task-form"

interface EditTaskPageProps {
  params: {
    id: string
  }
}

export default function EditTaskPage({ params }: EditTaskPageProps) {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Edit Task</h1>
        <EditTaskForm taskId={params.id} />
      </div>
    </DashboardLayout>
  )
}

