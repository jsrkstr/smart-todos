import { AppLayout } from "@/components/layouts/app-layout"
import { EditTaskForm } from "@/components/tasks/edit-task-form"

interface EditTaskPageProps {
  params: {
    id: string
  }
}

export default function EditTaskPage({ params }: EditTaskPageProps) {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <EditTaskForm taskId={params.id} />
      </div>
    </AppLayout>
  )
}

