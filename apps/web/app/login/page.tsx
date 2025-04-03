import { OAuthLogin } from "@/components/auth/oauth-login"
import React from "react"

export default async function LoginPage({ searchParams }: { searchParams: { redirect?: string } }): React.ReactNode {
  const { redirect } = await searchParams;
  const redirectUrl = redirect || "/dashboard";
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <OAuthLogin redirectUrl={redirectUrl} />
    </div>
  )
} 
