import { AppLayout } from "@/components/layouts/app-layout"
import { SettingsForm } from "@/components/settings/settings-form"

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <SettingsForm />
      </div>
    </AppLayout>
  )
}

