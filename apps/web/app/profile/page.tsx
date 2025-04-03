import { AppLayout } from "@/components/layouts/app-layout"
import { UserProfile } from "@/components/profile/user-profile"

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <UserProfile />
      </div>
    </AppLayout>
  )
}

