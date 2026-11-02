"use client"

import { ReactNode } from "react"
import { Lock, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth-store"
import Link from "next/link"

type PlanType = "basic" | "professional" | "advanced"

interface PlanRestrictionProps {
  /** The minimum plan required to access this feature */
  requiredPlan: "professional" | "advanced"
  /** The content to show when the user has access */
  children: ReactNode
  /** Optional custom message */
  message?: string
  /** Show as inline badge instead of block */
  inline?: boolean
}

const planLabels: Record<PlanType, string> = {
  basic: "Básico",
  professional: "Profissional",
  advanced: "Avançado",
}

/**
 * Wraps content that is restricted to certain plans.
 * Shows the content if the user has access (correct plan or trial).
 * Shows a restriction message with upgrade button if not.
 */
export function PlanRestriction({
  requiredPlan,
  children,
  message,
  inline = false,
}: PlanRestrictionProps) {
  const { clinic } = useAuthStore()

  const userPlan = clinic?.account?.plan?.slug || "basic"
  const subscriptionStatus = clinic?.account?.subscription_status || "trial"

  // Trial users have full access
  const isTrialUser = subscriptionStatus === "trial"

  // Check if user has required plan level
  const planHierarchy: PlanType[] = ["basic", "professional", "advanced"]
  const userPlanIndex = planHierarchy.indexOf(userPlan as PlanType)
  const requiredPlanIndex = planHierarchy.indexOf(requiredPlan)
  const hasRequiredPlan = userPlanIndex >= requiredPlanIndex

  // Show content if user has access
  if (isTrialUser || hasRequiredPlan) {
    return <>{children}</>
  }

  // Show restriction message
  const defaultMessage = `Disponível no plano ${planLabels[requiredPlan]}`
  const displayMessage = message || defaultMessage

  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <Lock className="h-3 w-3" />
          {displayMessage}
        </Badge>
        <Link href="/planos">
          <Button size="sm" variant="outline" className="h-6 text-xs gap-1">
            Fazer upgrade
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 p-4">
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-muted p-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{displayMessage}</p>
          <p className="text-xs text-muted-foreground">
            Faça upgrade para desbloquear esta funcionalidade
          </p>
        </div>
        <Link href="/planos">
          <Button size="sm" className="gap-1">
            Fazer upgrade
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

/**
 * Hook to check if a feature is available for the current user
 */
export function useFeatureAccess(requiredPlan: "professional" | "advanced"): {
  hasAccess: boolean
  isTrialUser: boolean
  currentPlan: string
  requiredPlan: string
} {
  const { clinic } = useAuthStore()

  const userPlan = clinic?.account?.plan?.slug || "basic"
  const subscriptionStatus = clinic?.account?.subscription_status || "trial"

  const isTrialUser = subscriptionStatus === "trial"

  const planHierarchy: PlanType[] = ["basic", "professional", "advanced"]
  const userPlanIndex = planHierarchy.indexOf(userPlan as PlanType)
  const requiredPlanIndex = planHierarchy.indexOf(requiredPlan)
  const hasRequiredPlan = userPlanIndex >= requiredPlanIndex

  return {
    hasAccess: isTrialUser || hasRequiredPlan,
    isTrialUser,
    currentPlan: planLabels[userPlan as PlanType] || userPlan,
    requiredPlan: planLabels[requiredPlan],
  }
}
