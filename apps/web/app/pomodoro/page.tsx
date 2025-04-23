import { AppLayout } from "@/components/layouts/app-layout"
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer"

export default function PomodoroPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <PomodoroTimer />
      </div>
    </AppLayout>
  )
}

