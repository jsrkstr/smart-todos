import { AppLayout } from "@/components/layouts/app-layout"
import { RewardsCenter } from "@/components/rewards/rewards-center"

export default function RewardsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <RewardsCenter />
      </div>
    </AppLayout>
  )
}

