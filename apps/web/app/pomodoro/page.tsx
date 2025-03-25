import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer"

export default function PomodoroPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Pomodoro Timer</h1>
        <PomodoroTimer />
      </div>
    </DashboardLayout>
  )
}

