import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { AddTaskForm } from "@/components/tasks/add-task-form"

export default function AddTaskPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Add New Task</h1>
        <AddTaskForm />
      </div>
    </DashboardLayout>
  )
}

