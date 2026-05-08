// Meta Pixel helpers. Keep all fbq calls flowing through this module so every
// event ships with `value` + `currency` and the dataset stays free of the
// "missing parameters" / "same price for all StartTrial" warnings.

export type PlanKey = 'trial' | 'basic' | 'professional' | 'advanced'
export type BillingCycle = 'monthly' | 'annually'
export type PricingVariant = 'solo' | 'clinic'

export interface PublicConfigPlan {
  limit_professionals: number
  price_monthly: number
  price_yearly: number
  solo_price_monthly: number
  solo_price_yearly: number
  excess_price: number
}

export interface PublicConfig {
  trial_days: number
  plans: { [key: string]: PublicConfigPlan }
}

const num = (v: string | undefined, d: number) => {
  const n = parseInt(v ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : d
}

// Fallback prices used when the public config endpoint is unreachable.
// Mirrors backend defaults (settings_service.go) and can be overridden via
// NEXT_PUBLIC_FALLBACK_* env vars so values stay configurable.
export const FALLBACK_CONFIG: PublicConfig = {
  trial_days: num(process.env.NEXT_PUBLIC_FALLBACK_TRIAL_DAYS, 14),
  plans: {
    basic: {
      limit_professionals: 3,
      price_monthly: num(process.env.NEXT_PUBLIC_FALLBACK_PRICE_BASIC, 99),
      price_yearly: num(process.env.NEXT_PUBLIC_FALLBACK_PRICE_BASIC_YEARLY, 990),
      solo_price_monthly: 0,
      solo_price_yearly: 0,
      excess_price: 20,
    },
    professional: {
      limit_professionals: 7,
      price_monthly: num(process.env.NEXT_PUBLIC_FALLBACK_PRICE_PROFESSIONAL, 199),
      price_yearly: num(process.env.NEXT_PUBLIC_FALLBACK_PRICE_PROFESSIONAL_YEARLY, 1990),
      solo_price_monthly: 0,
      solo_price_yearly: 0,
      excess_price: 20,
    },
    advanced: {
      limit_professionals: 14,
      price_monthly: num(process.env.NEXT_PUBLIC_FALLBACK_PRICE_ADVANCED, 349),
      price_yearly: num(process.env.NEXT_PUBLIC_FALLBACK_PRICE_ADVANCED_YEARLY, 3490),
      solo_price_monthly: 0,
      solo_price_yearly: 0,
      excess_price: 0,
    },
  },
}

export const PIXEL_CURRENCY = process.env.NEXT_PUBLIC_PIXEL_CURRENCY || 'BRL'

type FbqFn = (...args: unknown[]) => void

function getFbq(): FbqFn | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { fbq?: FbqFn }).fbq
}

export interface LeadValueInput {
  plan: PlanKey
  billingCycle?: BillingCycle
  variant?: PricingVariant
  units?: number
  publicConfig?: PublicConfig | null
}

// Returns the monthly subscription value (in BRL) the visitor showed intent for.
// Different combinations of plan + variant (solo vs clinic) + cycle + units must
// yield distinct values so Meta can attribute conversion value correctly.
export function computeMonthlyPlanValue({
  plan,
  billingCycle = 'monthly',
  variant = 'clinic',
  units = 2,
  publicConfig,
}: LeadValueInput): number {
  const fallback = FALLBACK_CONFIG.plans
  const apiPlans = publicConfig?.plans
  const pickPlan = (key: 'basic' | 'professional' | 'advanced'): PublicConfigPlan => {
    const api = apiPlans?.[key]
    return api && api.price_monthly > 0 ? api : fallback[key]
  }

  if (plan === 'trial') {
    const p = pickPlan('professional')
    return p.price_monthly
  }

  if (plan === 'basic' || plan === 'professional') {
    const p = pickPlan(plan)
    const useSolo = variant === 'solo' && (p.solo_price_monthly > 0 || p.solo_price_yearly > 0)
    if (useSolo) {
      if (billingCycle === 'monthly') return p.solo_price_monthly
      if (p.solo_price_yearly > 0) return Math.round(p.solo_price_yearly / 12)
      return Math.round((p.solo_price_monthly * 10) / 12)
    }
    if (billingCycle === 'monthly') return p.price_monthly
    if (p.price_yearly > 0) return Math.round(p.price_yearly / 12)
    return Math.round((p.price_monthly * 10) / 12)
  }

  if (plan === 'advanced') {
    const p = pickPlan('advanced')
    const safeUnits = Math.max(2, units)
    const monthlyUnit =
      billingCycle === 'monthly'
        ? p.price_monthly
        : p.price_yearly > 0
          ? Math.round(p.price_yearly / 12)
          : Math.round((p.price_monthly * 10) / 12)
    return monthlyUnit * safeUnits
  }

  return 0
}

function categoryFor(input: LeadValueInput): string {
  if (input.plan === 'trial') return 'trial'
  return `${input.variant ?? 'clinic'}_${input.billingCycle ?? 'monthly'}`
}

// Lead + StartTrial fire together on plan-select intent: every signup, paid or
// free, begins with a 14-day trial in the backend, so StartTrial here matches
// reality and gives Meta enough distinct values (>5) to clear the dataset
// warning.
export function trackPlanLead(input: LeadValueInput): void {
  const fbq = getFbq()
  if (!fbq) return
  const value = computeMonthlyPlanValue(input)
  const payload: Record<string, unknown> = {
    content_name: input.plan,
    content_category: categoryFor(input),
    value,
    currency: PIXEL_CURRENCY,
  }
  fbq('track', 'Lead', payload)
  fbq('track', 'StartTrial', { ...payload, predicted_ltv: value * 12 })
}

// Fired on successful account creation. Matches Meta's "CompleteRegistration"
// standard event so the funnel reads Lead → CompleteRegistration → Subscribe.
export function trackCompleteRegistration(
  input: LeadValueInput & { method?: string }
): void {
  const fbq = getFbq()
  if (!fbq) return
  const value = computeMonthlyPlanValue(input)
  fbq('track', 'CompleteRegistration', {
    content_name: input.plan,
    content_category: categoryFor(input),
    registration_method: input.method,
    value,
    currency: PIXEL_CURRENCY,
  })
}

interface SubscribeInput {
  plan: PlanKey
  billingCycle: BillingCycle
  variant?: PricingVariant
  units?: number
  // Charge value (in BRL) actually billed for this cycle — for YEARLY this is
  // the full annual amount, for MONTHLY just the monthly amount.
  cycleValue: number
  transactionId?: string
  paymentMethod?: 'pix' | 'credit_card'
  publicConfig?: PublicConfig | null
}

// Subscribe is Meta's recommended event for recurring purchases. We also fire
// Purchase so attribution works for ad accounts that target the standard
// e-commerce funnel.
export function trackSubscribe(input: SubscribeInput): void {
  const fbq = getFbq()
  if (!fbq) return
  const monthlyValue = computeMonthlyPlanValue({
    plan: input.plan,
    billingCycle: input.billingCycle,
    variant: input.variant,
    units: input.units,
    publicConfig: input.publicConfig,
  })
  const predictedLtv = monthlyValue * 12
  const basePayload: Record<string, unknown> = {
    content_name: input.plan,
    content_category: categoryFor({
      plan: input.plan,
      billingCycle: input.billingCycle,
      variant: input.variant,
    }),
    value: input.cycleValue,
    currency: PIXEL_CURRENCY,
  }
  fbq('track', 'Subscribe', { ...basePayload, predicted_ltv: predictedLtv })
  fbq('track', 'Purchase', {
    ...basePayload,
    content_type: 'product',
    content_ids: [input.plan],
    num_items: input.units ?? 1,
    transaction_id: input.transactionId,
    payment_method: input.paymentMethod,
  })
}
