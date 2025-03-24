import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { RewardsCenter } from "@/components/rewards/rewards-center"

export default function RewardsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Rewards Center</h1>
        <RewardsCenter />
      </div>
    </DashboardLayout>
  )
}

