import { OAuthLogin } from "@/components/auth/oauth-login"
import React from "react"

export default function LoginPage(): React.ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <OAuthLogin />
    </div>
  )
} 