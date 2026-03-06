"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { AlertTriangle, CreditCard, Loader2, LogOut } from "lucide-react"

// Checks if the current subscription is expired/inactive
function isSubscriptionExpired(clinic: { subscription_status: string; trial_ends_at?: string } | null): boolean {
  if (!clinic) return false

  const status = clinic.subscription_status
  if (status === "active") return false

  if (status === "trial") {
    if (!clinic.trial_ends_at) return true
    return new Date(clinic.trial_ends_at) < new Date()
  }

  // pending, past_due, canceled, expired
  return true
}

interface SubscriptionGuardProps {
  children: React.ReactNode
  lng: string
}

export function SubscriptionGuard({ children, lng }: SubscriptionGuardProps) {
  const { clinic, user, logout, loadUser } = useAuthStore()
  const router = useRouter()
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    setExpired(isSubscriptionExpired(clinic))
  }, [clinic])

  // Listen for subscription-expired events from API interceptor
  useEffect(() => {
    const handler = () => setExpired(true)
    window.addEventListener("subscription-expired", handler)
    return () => window.removeEventListener("subscription-expired", handler)
  }, [])

  // Poll for payment confirmation when status is pending
  useEffect(() => {
    if (clinic?.subscription_status !== "pending") return

    const interval = setInterval(async () => {
      await loadUser()
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [clinic?.subscription_status, loadUser])

  if (!expired) return <>{children}</>

  const isOwner = user?.role === "owner"
  const isPending = clinic?.subscription_status === "pending"

  // Pending payment: show waiting screen
  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-4 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>

            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              Aguardando confirmação de pagamento
            </h1>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              Seu pagamento está sendo processado. Assim que for confirmado, seu acesso será liberado automaticamente.
            </p>

            <div className="flex w-full flex-col gap-3">
              <button
                onClick={() => logout().then(() => router.push(`/${lng}/login`))}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-4 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>

          {isOwner ? (
            <>
              <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                {clinic?.subscription_status === "trial"
                  ? "Período de teste expirado"
                  : "Assinatura expirada"}
              </h1>
              <p className="mb-6 text-slate-600 dark:text-slate-400">
                {clinic?.subscription_status === "trial"
                  ? "Seu período de teste acabou. Escolha um plano para continuar usando o Aseno."
                  : "Sua assinatura expirou. Renove para continuar acessando seus dados."}
              </p>

              <div className="flex w-full flex-col gap-3">
                <button
                  onClick={() => router.push(`/${lng}#pricing`)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <CreditCard className="h-4 w-4" />
                  Escolher um Plano
                </button>
                <button
                  onClick={() => logout().then(() => router.push(`/${lng}/login`))}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                Acesso Temporariamente Indisponível
              </h1>
              <p className="mb-6 text-slate-600 dark:text-slate-400">
                O plano da clínica expirou. Entre em contato com o proprietário para renovar a assinatura.
              </p>

              <button
                onClick={() => logout().then(() => router.push(`/${lng}/login`))}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

