import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { SettingsForm } from "@/components/settings/settings-form"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <SettingsForm />
      </div>
    </DashboardLayout>
  )
}

