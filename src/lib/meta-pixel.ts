// Meta Pixel helpers. Keep all fbq calls flowing through this module so every
// event ships with `value` + `currency`, fires an `event_id` for the
// browser/server-side dedup contract, and mirrors the event to the
// Conversions API (server-side) at /api/v1/meta/events.

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
const CAPI_API_URL = process.env.NEXT_PUBLIC_API_URL || ''

type FbqFn = (...args: unknown[]) => void

function getFbq(): FbqFn | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { fbq?: FbqFn }).fbq
}

// UserDataInput is the optional PII bundle callers attach to a track event.
// Sent raw to the backend, which hashes before forwarding to Meta. The
// browser pixel doesn't need this — Meta's tag already collects fbp/fbc/IP/UA
// from the page itself.
export interface UserDataInput {
  email?: string
  phone?: string
  externalId?: string
}

function readCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : ''
}

// newEventID returns an opaque id shared with fbq's `eventID` option and the
// CAPI mirror body. Same value on both sides → Meta dedupes the pair.
export function newEventID(): string {
  if (typeof crypto !== 'undefined' && typeof (crypto as Crypto).randomUUID === 'function') {
    return (crypto as Crypto).randomUUID()
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

interface FireMirrorOpts {
  eventID: string
  eventName: string
  eventSourceURL?: string
  userData?: UserDataInput
  customData?: Record<string, unknown>
}

// fireServerMirror posts the same event to the backend so it can forward via
// CAPI. Best-effort — failures are swallowed; the browser pixel still counts.
function fireServerMirror(opts: FireMirrorOpts): void {
  if (typeof window === 'undefined') return
  if (typeof fetch !== 'function') return
  if (!CAPI_API_URL) return

  const ud = opts.userData ?? {}
  const fbp = readCookie('_fbp')
  const fbc = readCookie('_fbc')

  const body = {
    event_id: opts.eventID,
    event_name: opts.eventName,
    event_source_url: opts.eventSourceURL ?? window.location.href,
    user_data: {
      ...(ud.email ? { email: ud.email } : {}),
      ...(ud.phone ? { phone: ud.phone } : {}),
      ...(ud.externalId ? { external_id: ud.externalId } : {}),
      ...(fbp ? { fbp } : {}),
      ...(fbc ? { fbc } : {}),
    },
    ...(opts.customData ? { custom_data: opts.customData } : {}),
  }

  try {
    void fetch(`${CAPI_API_URL}/meta/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // ignore — analytics must not break the page
  }
}

// trackEvent fires the browser pixel + CAPI mirror with a shared event_id.
// Exported so callers (PageView, future custom events) can use the same
// dedup contract without going through the value-aware helpers below.
export function trackEvent(
  eventName: string,
  payload: Record<string, unknown> = {},
  userData?: UserDataInput,
): string {
  const fbq = getFbq()
  const eventID = newEventID()
  if (fbq) {
    fbq('track', eventName, payload, { eventID })
  }
  fireServerMirror({
    eventID,
    eventName,
    userData,
    customData: Object.keys(payload).length > 0 ? payload : undefined,
  })
  return eventID
}

export interface LeadValueInput {
  plan: PlanKey
  billingCycle?: BillingCycle
  variant?: PricingVariant
  units?: number
  publicConfig?: PublicConfig | null
  userData?: UserDataInput
}

// Returns the monthly subscription value (in BRL) the visitor showed intent for.
// Different combinations of plan + variant (solo vs clinic) + cycle + units must
// yield distinct values so Meta can attribute conversion value correctly.
// The result is guaranteed to be a finite positive integer — Meta's CAPI rejects
// StartTrial events whose `predicted_ltv` (value * 12) is 0 or non-numeric.
export function computeMonthlyPlanValue(input: LeadValueInput): number {
  const raw = computeMonthlyPlanValueRaw(input)
  if (Number.isFinite(raw) && raw > 0) return Math.round(raw)
  // Defensive floor: unknown plan keys, mis-configured pricing, or fetch races
  // can yield 0/NaN. Fall back to the professional monthly price so we still
  // ship a meaningful positive value to Meta (any value > 0 is valid).
  const apiPro = input.publicConfig?.plans?.['professional']
  const proMonthly = apiPro && apiPro.price_monthly > 0
    ? apiPro.price_monthly
    : FALLBACK_CONFIG.plans.professional.price_monthly
  return Math.max(1, Math.round(proMonthly))
}

function computeMonthlyPlanValueRaw({
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
      if (billingCycle === 'monthly') {
        // When the DB only configures the yearly solo price, derive a monthly
        // value from it instead of returning 0 (which made predicted_ltv invalid).
        if (p.solo_price_monthly > 0) return p.solo_price_monthly
        if (p.solo_price_yearly > 0) return Math.round(p.solo_price_yearly / 12)
        return p.price_monthly
      }
      if (p.solo_price_yearly > 0) return Math.round(p.solo_price_yearly / 12)
      if (p.solo_price_monthly > 0) return Math.round((p.solo_price_monthly * 10) / 12)
      return p.price_monthly
    }
    if (billingCycle === 'monthly') return p.price_monthly
    if (p.price_yearly > 0) return Math.round(p.price_yearly / 12)
    return Math.round((p.price_monthly * 10) / 12)
  }

  if (plan === 'advanced') {
    const p = pickPlan('advanced')
    const safeUnits = Number.isFinite(units) && units >= 2 ? Math.floor(units) : 2
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

// Meta CAPI rejects events whose monetary fields are not positive finite numbers.
// `computeMonthlyPlanValue` already guarantees a positive value, but we re-clamp
// here so the contract for the outgoing event payload is explicit at the call site.
function positiveNumber(n: number, fallback: number): number {
  return Number.isFinite(n) && n > 0 ? n : fallback
}

// fireBoth dispatches the same event to fbq and the CAPI mirror with one
// shared eventID. Keeps every track* helper consistent without repeating the
// boilerplate.
function fireBoth(
  eventName: string,
  payload: Record<string, unknown>,
  userData: UserDataInput | undefined,
): void {
  const fbq = getFbq()
  const eventID = newEventID()
  if (fbq) {
    fbq('track', eventName, payload, { eventID })
  }
  fireServerMirror({
    eventID,
    eventName,
    userData,
    customData: payload,
  })
}

// trackPlanLead fires on plan-select intent (CTA click on the landing). This
// is *intent*, not a started trial — Meta's funnel here is `Lead` only. The
// account doesn't exist yet, no trial has started.
export function trackPlanLead(input: LeadValueInput): void {
  const value = positiveNumber(
    computeMonthlyPlanValue(input),
    FALLBACK_CONFIG.plans.professional.price_monthly,
  )
  const payload: Record<string, unknown> = {
    content_name: input.plan,
    content_category: categoryFor(input),
    value,
    currency: PIXEL_CURRENCY,
  }
  fireBoth('Lead', payload, input.userData)
}

// Fired on successful account creation. Every signup, paid or free, begins
// with a 14-day trial in the backend, so we fire CompleteRegistration AND
// StartTrial here — this is the moment the trial actually starts. Funnel:
// Lead (landing CTA) → CompleteRegistration + StartTrial (account created)
// → Subscribe + Purchase (paid conversion).
export function trackCompleteRegistration(
  input: LeadValueInput & { method?: string }
): void {
  const value = positiveNumber(
    computeMonthlyPlanValue(input),
    FALLBACK_CONFIG.plans.professional.price_monthly,
  )
  const predictedLtv = positiveNumber(value * 12, value * 12 || 1)
  fireBoth(
    'CompleteRegistration',
    {
      content_name: input.plan,
      content_category: categoryFor(input),
      registration_method: input.method,
      value,
      currency: PIXEL_CURRENCY,
    },
    input.userData,
  )
  fireBoth(
    'StartTrial',
    {
      content_name: input.plan,
      content_category: categoryFor(input),
      value,
      currency: PIXEL_CURRENCY,
      predicted_ltv: predictedLtv,
    },
    input.userData,
  )
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
  userData?: UserDataInput
}

// Subscribe is Meta's recommended event for recurring purchases. We also fire
// Purchase so attribution works for ad accounts that target the standard
// e-commerce funnel.
export function trackSubscribe(input: SubscribeInput): void {
  const monthlyValue = positiveNumber(
    computeMonthlyPlanValue({
      plan: input.plan,
      billingCycle: input.billingCycle,
      variant: input.variant,
      units: input.units,
      publicConfig: input.publicConfig,
    }),
    FALLBACK_CONFIG.plans.professional.price_monthly,
  )
  const cycleValue = positiveNumber(input.cycleValue, monthlyValue)
  const predictedLtv = positiveNumber(monthlyValue * 12, monthlyValue * 12 || 1)
  const basePayload: Record<string, unknown> = {
    content_name: input.plan,
    content_category: categoryFor({
      plan: input.plan,
      billingCycle: input.billingCycle,
      variant: input.variant,
    }),
    value: cycleValue,
    currency: PIXEL_CURRENCY,
  }
  fireBoth(
    'Subscribe',
    { ...basePayload, predicted_ltv: predictedLtv },
    input.userData,
  )
  fireBoth(
    'Purchase',
    {
      ...basePayload,
      content_type: 'product',
      content_ids: [input.plan],
      num_items: input.units ?? 1,
      transaction_id: input.transactionId,
      payment_method: input.paymentMethod,
    },
    input.userData,
  )
}
