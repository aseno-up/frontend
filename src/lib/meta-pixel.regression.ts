// Regression check for the Meta CAPI warnings:
//   - "predicted_ltv must be numeric > 0" (StartTrial)
//   - "value must be numeric > 0" (Lead, StartTrial, CompleteRegistration, Subscribe, Purchase)
//
// Run with:
//   cd frontend && TS_NODE_PROJECT='' ts-node --transpile-only --skip-project \
//     --compiler-options '{"module":"commonjs","moduleResolution":"node","esModuleInterop":true,"jsx":"preserve","target":"es2020","strict":false}' \
//     src/lib/meta-pixel.regression.ts
//
// Exits non-zero if any scenario emits a non-positive or non-finite `value` or
// `predicted_ltv` on a Meta Pixel event. This file is intentionally kept
// alongside the module so the imports use the same project resolution as the
// production build; it has no runtime effect on the bundled app (it's never
// imported by Next).

import {
  computeMonthlyPlanValue,
  trackPlanLead,
  trackCompleteRegistration,
  trackSubscribe,
  FALLBACK_CONFIG,
  type LeadValueInput,
  type PublicConfig,
} from './meta-pixel'

const cfgSoloYearlyOnly: PublicConfig = {
  trial_days: 14,
  plans: {
    basic: {
      limit_professionals: 3,
      price_monthly: 99,
      price_yearly: 990,
      solo_price_monthly: 0,
      solo_price_yearly: 588,
      excess_price: 20,
    },
    professional: {
      limit_professionals: 7,
      price_monthly: 199,
      price_yearly: 1990,
      solo_price_monthly: 0,
      solo_price_yearly: 1188,
      excess_price: 20,
    },
    advanced: {
      limit_professionals: 14,
      price_monthly: 349,
      price_yearly: 3490,
      solo_price_monthly: 0,
      solo_price_yearly: 0,
      excess_price: 0,
    },
  },
}

// ─── computeMonthlyPlanValue: positive-value invariant ─────────────────────
let failures = 0
function checkValue(label: string, input: LeadValueInput) {
  const value = computeMonthlyPlanValue(input)
  const predictedLtv = value * 12
  const ok =
    Number.isFinite(value) && value > 0 &&
    Number.isFinite(predictedLtv) && predictedLtv > 0
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(60)} value=${value}  predicted_ltv=${predictedLtv}`,
  )
  if (!ok) failures++
}

checkValue('trial (no config)', { plan: 'trial' })
checkValue('basic solo monthly (yearly-only DB config)', {
  plan: 'basic',
  billingCycle: 'monthly',
  variant: 'solo',
  publicConfig: cfgSoloYearlyOnly,
})
checkValue('professional solo monthly (yearly-only DB config)', {
  plan: 'professional',
  billingCycle: 'monthly',
  variant: 'solo',
  publicConfig: cfgSoloYearlyOnly,
})
checkValue('basic solo annually (yearly-only DB config)', {
  plan: 'basic',
  billingCycle: 'annually',
  variant: 'solo',
  publicConfig: cfgSoloYearlyOnly,
})
checkValue('advanced clinic monthly 2 units', {
  plan: 'advanced',
  billingCycle: 'monthly',
  variant: 'clinic',
  units: 2,
  publicConfig: cfgSoloYearlyOnly,
})
checkValue('unknown plan key (defensive)', {
  // @ts-expect-error: simulate a malformed plan key (e.g. URL param leak)
  plan: 'mystery',
  billingCycle: 'monthly',
})
checkValue('fallback config trial', { plan: 'trial', publicConfig: FALLBACK_CONFIG })

// ─── tracker entrypoints: every emitted fbq payload has positive value ─────
type FbqCall = { event: string; payload: Record<string, unknown> }
const captured: FbqCall[] = []
;(globalThis as unknown as { window: unknown }).window = {
  fbq(...args: unknown[]) {
    if (args[0] === 'track' && typeof args[1] === 'string') {
      captured.push({ event: args[1], payload: (args[2] ?? {}) as Record<string, unknown> })
    }
  },
}

function assertPayloadHasPositiveValue(label: string, event: string) {
  const calls = captured.filter((c) => c.event === event)
  if (calls.length === 0) {
    console.log(`FAIL  ${label.padEnd(60)} no ${event} event captured`)
    failures++
    return
  }
  for (const call of calls) {
    const v = call.payload.value as number | undefined
    const ltv = call.payload.predicted_ltv as number | undefined
    const valueOk = typeof v === 'number' && Number.isFinite(v) && v > 0
    const ltvOk = ltv === undefined || (typeof ltv === 'number' && Number.isFinite(ltv) && ltv > 0)
    const ok = valueOk && ltvOk
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(60)} ${event} value=${v} predicted_ltv=${ltv}`,
    )
    if (!ok) failures++
  }
}

// trackPlanLead — solo monthly with yearly-only DB config (the prod bug)
captured.length = 0
trackPlanLead({
  plan: 'basic',
  billingCycle: 'monthly',
  variant: 'solo',
  publicConfig: cfgSoloYearlyOnly,
})
assertPayloadHasPositiveValue('trackPlanLead basic solo monthly', 'Lead')
assertPayloadHasPositiveValue('trackPlanLead basic solo monthly', 'StartTrial')

// trackPlanLead — trial w/ no config (HeroCTA/NavCTA cold path)
captured.length = 0
trackPlanLead({ plan: 'trial' })
assertPayloadHasPositiveValue('trackPlanLead trial cold', 'Lead')
assertPayloadHasPositiveValue('trackPlanLead trial cold', 'StartTrial')

// trackCompleteRegistration — should always have value > 0
captured.length = 0
trackCompleteRegistration({ plan: 'trial', method: 'email' })
assertPayloadHasPositiveValue('trackCompleteRegistration trial', 'CompleteRegistration')

// trackSubscribe — caller passes cycleValue=0 (race vs publicConfig load)
captured.length = 0
trackSubscribe({
  plan: 'basic',
  billingCycle: 'monthly',
  variant: 'solo',
  cycleValue: 0,
  transactionId: 'pay_test',
  paymentMethod: 'credit_card',
  publicConfig: cfgSoloYearlyOnly,
})
assertPayloadHasPositiveValue('trackSubscribe cycleValue=0 fallback', 'Subscribe')
assertPayloadHasPositiveValue('trackSubscribe cycleValue=0 fallback', 'Purchase')

// trackSubscribe — happy path
captured.length = 0
trackSubscribe({
  plan: 'professional',
  billingCycle: 'annually',
  variant: 'clinic',
  cycleValue: 1990,
  transactionId: 'pay_happy',
  paymentMethod: 'pix',
  publicConfig: cfgSoloYearlyOnly,
})
assertPayloadHasPositiveValue('trackSubscribe happy yearly clinic', 'Subscribe')
assertPayloadHasPositiveValue('trackSubscribe happy yearly clinic', 'Purchase')

if (failures > 0) {
  console.error(`\n${failures} scenario(s) emitted an invalid value/predicted_ltv.`)
  process.exit(1)
}
console.log('\nAll scenarios produced positive numeric value and predicted_ltv.')
