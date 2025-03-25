import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { ProgressTracking } from "@/components/progress/progress-tracking"

export default function ProgressPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Progress Tracking</h1>
        <ProgressTracking />
      </div>
    </DashboardLayout>
  )
}

