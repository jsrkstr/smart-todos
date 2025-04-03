import { AppLayout } from "@/components/layouts/app-layout"
import { ProgressTracking } from "@/components/progress/progress-tracking"

export default function ProgressPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <ProgressTracking />
      </div>
    </AppLayout>
  )
}

