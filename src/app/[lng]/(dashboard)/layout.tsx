"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { SubscriptionGuard } from "@/components/subscription-guard"
import { useAuthStore } from "@/stores/auth-store"

interface DashboardLayoutProps {
  children: React.ReactNode
  params: Promise<{ lng: string }>
}

export default function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, loadUser } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  useEffect(() => {
    const checkAuth = async () => {
      const { lng } = await params
      if (!isLoading && !isAuthenticated) {
        router.push(`/${lng}/login`)
      }
    }
    checkAuth()
  }, [isLoading, isAuthenticated, router, params])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <DashboardLayoutContent params={params}>{children}</DashboardLayoutContent>
  )
}

function DashboardLayoutContent({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lng: string }>
}) {
  const lng = "pt-BR" // Default, will be overridden

  useEffect(() => {
    // Resolve params asynchronously
    params.then(() => {})
  }, [params])

  return (
    <SubscriptionGuard lng={lng}>
      <div className="flex h-screen bg-muted/30">
        <Sidebar lng={lng} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </SubscriptionGuard>
  )
}
