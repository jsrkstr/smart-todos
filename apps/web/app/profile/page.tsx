import { AppLayout } from "@/components/layouts/app-layout"
import { UserProfile } from "@/components/profile/user-profile"

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        <UserProfile />
      </div>
    </AppLayout>
  )
}

