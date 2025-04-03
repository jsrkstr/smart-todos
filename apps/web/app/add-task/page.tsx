import { AppLayout } from "@/components/layouts/app-layout"
import { AddTaskForm } from "@/components/tasks/add-task-form"

export default function AddTaskPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <AddTaskForm />
      </div>
    </AppLayout>
  )
}

