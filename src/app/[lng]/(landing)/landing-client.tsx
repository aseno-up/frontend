'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { gtagEvent } from '@/lib/gtag'
import {
  FALLBACK_CONFIG,
  trackPlanLead,
  type PlanKey,
  type PricingVariant,
  type PublicConfig,
} from '@/lib/meta-pixel'
import type { ActivePromotion } from '@/lib/server/promotion'

export type { PublicConfig }

interface LandingClientProps {
  lng: string
  publicConfig?: PublicConfig | null
  promotion?: ActivePromotion | null
}

// Client component for interactive hero CTA buttons
export function HeroCTA({ lng, publicConfig: initialConfig = null }: LandingClientProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(initialConfig)

  useEffect(() => {
    if (publicConfig) return
    const fetchConfig = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
        const response = await fetch(`${baseUrl}/api/v1/public/config`, { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          setPublicConfig(data)
        }
      } catch (err) {}
    }
    fetchConfig()
  }, [publicConfig])

  const getTrialDays = (): number => publicConfig?.trial_days || 14

  const handlePlanSelect = (plan: string) => {
    trackPlanLead({ plan: plan as PlanKey, billingCycle: 'monthly', publicConfig })
    // Plan-click is product-selection intent, not a captured lead. Using
    // `generate_lead` here was double-counting against the contact/kit forms
    // and pointing Google Ads at the wrong conversion (algo optimized for
    // CTA clicks instead of real leads).
    gtagEvent('select_item', { item_list_id: 'pricing', item_id: plan })
    const target = isAuthenticated ? 'billing-setup' : 'register'
    const url = new URL(`/${lng}/${target}`, window.location.origin)
    url.searchParams.set('plan', plan)

    let cycle = 'MONTHLY'
    if (plan === 'trial') cycle = 'MONTHLY'

    url.searchParams.set('billing', cycle)

    const currentParams = new URLSearchParams(window.location.search)
    const offer = currentParams.get('offer')
    if (offer) {
      url.searchParams.set('offer', offer)
    }

    router.push(url.pathname + url.search)
  }

  return (
    <div className="hero-actions">
      <button className="btn-lg" onClick={() => handlePlanSelect('trial')}>Testar grátis por {getTrialDays()} dias &rarr;</button>
    </div>
  )
}

// Client component for the navigation CTA buttons
export function NavCTA({ lng, publicConfig = null }: LandingClientProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const handlePlanSelect = (plan: string) => {
    trackPlanLead({ plan: plan as PlanKey, billingCycle: 'monthly', publicConfig })
    // Plan-click is product-selection intent, not a captured lead. Using
    // `generate_lead` here was double-counting against the contact/kit forms
    // and pointing Google Ads at the wrong conversion (algo optimized for
    // CTA clicks instead of real leads).
    gtagEvent('select_item', { item_list_id: 'pricing', item_id: plan })
    const target = isAuthenticated ? 'billing-setup' : 'register'
    const url = new URL(`/${lng}/${target}`, window.location.origin)
    url.searchParams.set('plan', plan)
    url.searchParams.set('billing', 'MONTHLY')

    const currentParams = new URLSearchParams(window.location.search)
    const offer = currentParams.get('offer')
    if (offer) url.searchParams.set('offer', offer)

    router.push(url.pathname + url.search)
  }

  return (
    <div className="nav-cta">
      <button className="btn-ghost" onClick={() => router.push(`/${lng}/login`)}>Entrar</button>
      <button className="btn-nav" onClick={() => handlePlanSelect('trial')}>Testar grátis</button>
    </div>
  )
}

// Client component for the pricing section (interactive toggle + plan selection)
export function PricingSection({ lng, publicConfig: initialConfig = null, promotion = null }: LandingClientProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly')
  // Each plan that supports solo gets its own variant state. Default = solo.
  const [variantByPlan, setVariantByPlan] = useState<Record<'basic' | 'professional', PricingVariant>>({
    basic: 'solo',
    professional: 'solo',
  })
  const [publicConfig, setPublicConfig] = useState<PublicConfig>(initialConfig ?? FALLBACK_CONFIG)
  const [advancedUnits, setAdvancedUnits] = useState<number>(2)
  const hadInitial = initialConfig != null

  useEffect(() => {
    if (hadInitial) return
    const fetchConfig = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
        const response = await fetch(`${baseUrl}/api/v1/public/config`, { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          setPublicConfig(data)
        }
      } catch (err) {}
    }
    fetchConfig()
  }, [hadInitial])

  const getTrialDays = (): number => publicConfig.trial_days || FALLBACK_CONFIG.trial_days

  const planHasSolo = (plan: 'basic' | 'professional' | 'advanced'): boolean => {
    const p = publicConfig.plans[plan]
    if (!p) return false
    return p.solo_price_monthly > 0 || p.solo_price_yearly > 0
  }

  const variantOf = (plan: 'basic' | 'professional'): PricingVariant => variantByPlan[plan]

  const calculateMonthlyPrice = (plan: 'basic' | 'professional' | 'advanced') => {
    const fallback = FALLBACK_CONFIG.plans[plan]
    const apiPlan = publicConfig.plans[plan]
    // Treat a 0 monthly price from the API as "not configured" and use the fallback
    // so visitors never see an empty price card.
    const planData = apiPlan && apiPlan.price_monthly > 0 ? apiPlan : fallback

    const useSolo =
      (plan === 'basic' || plan === 'professional') &&
      variantOf(plan) === 'solo' &&
      planHasSolo(plan)

    if (useSolo) {
      if (billingCycle === 'monthly') return planData.solo_price_monthly.toString()
      if (planData.solo_price_yearly > 0) {
        return Math.round(planData.solo_price_yearly / 12).toString()
      }
      return Math.round((planData.solo_price_monthly * 10) / 12).toString()
    }

    if (billingCycle === 'monthly') return planData.price_monthly.toString()
    if (planData.price_yearly > 0) {
      return Math.round(planData.price_yearly / 12).toString()
    }
    return Math.round((planData.price_monthly * 10) / 12).toString()
  }

  // Returns the original price (pre-discount) when the active promotion applies
  // to this plan, otherwise null. Used to render the strikethrough next to the
  // discounted amount. The discounted value continues to come from
  // calculateMonthlyPrice and is computed here too — we recompute instead of
  // passing both, so the existing solo/clinic + monthly/annual branches stay
  // the single source of truth for the original number.
  const promotionForPlan = (plan: 'basic' | 'professional' | 'advanced') => {
    if (!promotion) return null
    if (!promotion.plans_affected.includes(plan) && !promotion.plans_affected.includes('all')) {
      return null
    }
    const original = calculateMonthlyPrice(plan)
    const parsed = parseInt(original, 10)
    if (Number.isNaN(parsed) || parsed <= 0) return null
    const discounted = Math.max(1, Math.round((parsed * (100 - promotion.discount_percent)) / 100))
    return { original, discounted: String(discounted), pct: promotion.discount_percent }
  }

  const annualDiscountPct = (): number | null => {
    const plans: Array<'basic' | 'professional' | 'advanced'> = ['basic', 'professional', 'advanced']
    let min: number | null = null
    for (const key of plans) {
      const p = publicConfig.plans[key]
      if (!p || p.price_monthly <= 0) continue
      const yearly = p.price_yearly > 0 ? p.price_yearly : p.price_monthly * 10
      const pct = Math.floor((1 - yearly / (p.price_monthly * 12)) * 100)
      if (pct <= 0) continue
      if (min === null || pct < min) min = pct
    }
    return min
  }

  const advancedTotal = (): string => {
    const unit = calculateMonthlyPrice('advanced')
    if (unit === '—') return '—'
    const parsed = parseInt(unit, 10)
    if (Number.isNaN(parsed)) return '—'
    return (parsed * advancedUnits).toString()
  }

  const advancedDiscountedTotal = (): string | null => {
    const promo = promotionForPlan('advanced')
    if (!promo) return null
    const unit = parseInt(promo.discounted, 10)
    if (Number.isNaN(unit)) return null
    return (unit * advancedUnits).toString()
  }

  const renderPriceAmount = (plan: 'basic' | 'professional' | 'advanced') => {
    const promo = promotionForPlan(plan)
    const current = calculateMonthlyPrice(plan)
    if (!promo) {
      return (
        <>
          <sup>R$</sup> {current}
        </>
      )
    }
    return (
      <>
        <sup>R$</sup> {promo.discounted}
        <span className="price-amt-original">R$ {promo.original}</span>
        <span className="price-amt-tag">−{promo.pct}%</span>
      </>
    )
  }

  const handlePlanSelect = (plan: string) => {
    const isPaidWithSolo =
      (plan === 'basic' || plan === 'professional') &&
      variantOf(plan) === 'solo' &&
      planHasSolo(plan)
    trackPlanLead({
      plan: plan as PlanKey,
      billingCycle: plan === 'trial' ? 'monthly' : billingCycle,
      variant: isPaidWithSolo ? 'solo' : 'clinic',
      units: plan === 'advanced' ? Math.max(2, advancedUnits) : undefined,
      publicConfig,
    })
    // Plan-click is product-selection intent, not a captured lead. Using
    // `generate_lead` here was double-counting against the contact/kit forms
    // and pointing Google Ads at the wrong conversion (algo optimized for
    // CTA clicks instead of real leads).
    gtagEvent('select_item', { item_list_id: 'pricing', item_id: plan })
    const target = isAuthenticated ? 'billing-setup' : 'register'
    const url = new URL(`/${lng}/${target}`, window.location.origin)
    url.searchParams.set('plan', plan)

    let cycle = billingCycle === 'annually' ? 'YEARLY' : 'MONTHLY'
    if (plan === 'trial') cycle = 'MONTHLY'

    url.searchParams.set('billing', cycle)

    // Only carry the solo variant forward for plans that actually offer it and for paid plans.
    if (isPaidWithSolo) {
      url.searchParams.set('variant', 'solo')
    }

    // Não passa promotion_id na URL — o backend já consulta a promoção ativa
    // no momento do checkout e aplica se cobrir o plano. Server-side é a
    // fonte da verdade e a URL fica limpa.

    if (plan === 'advanced') {
      url.searchParams.set('units', String(Math.max(2, advancedUnits)))
    }

    const currentParams = new URLSearchParams(window.location.search)
    const offer = currentParams.get('offer')
    if (offer) url.searchParams.set('offer', offer)

    router.push(url.pathname + url.search)
  }

  const renderVariantToggle = (plan: 'basic' | 'professional') => {
    if (!planHasSolo(plan)) return null
    const current = variantOf(plan)
    return (
      <div
        className="ptoggle ptoggle-card"
        role="tablist"
        aria-label={`Modalidade de contrato do plano ${plan}`}
      >
        <button
          type="button"
          role="tab"
          aria-selected={current === 'solo'}
          className={`ptoggle-opt ${current === 'solo' ? 'active' : ''}`}
          onClick={() => setVariantByPlan((s) => ({ ...s, [plan]: 'solo' }))}
        >
          Autônomo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={current === 'clinic'}
          className={`ptoggle-opt ${current === 'clinic' ? 'active' : ''}`}
          onClick={() => setVariantByPlan((s) => ({ ...s, [plan]: 'clinic' }))}
        >
          Clínica
        </button>
      </div>
    )
  }

  return (
    <section className="sec sec-alt" id="precos">
      <div className="sec-hd" style={{ textAlign: 'center' }}>
        <h2 className="display-title">Preço por clínica, não por cabeça.</h2>
        <p className="sec-sub">{getTrialDays()} dias grátis no plano Profissional. Sem cartão de crédito.</p>
      </div>
      <div className="ptoggle" role="tablist" aria-label="Ciclo de cobrança">
        <button
          type="button"
          role="tab"
          aria-selected={billingCycle === 'monthly'}
          className={`ptoggle-opt ${billingCycle === 'monthly' ? 'active' : ''}`}
          onClick={() => setBillingCycle('monthly')}
        >
          Mensal
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={billingCycle === 'annually'}
          className={`ptoggle-opt ${billingCycle === 'annually' ? 'active' : ''}`}
          onClick={() => setBillingCycle('annually')}
        >
          Anual{annualDiscountPct() !== null && <span className="ptoggle-discount">-{annualDiscountPct()}%</span>}
        </button>
      </div>
      <div className="price-grid">
        <div className="price-card trial">
          <div className="price-nm">Teste Grátis</div>
          <div className="price-amt">R$ 0</div>
          <div className="price-per">por {getTrialDays()} dias</div>
          <hr className="price-div" />
          <ul className="price-feats">
            <li>Todas as funções Profissional</li>
            <li>Sem cartão de crédito</li>
            <li>Acesso imediato</li>
          </ul>
          <button className="btn-p btn-p-fill" onClick={() => handlePlanSelect('trial')}>Começar grátis</button>
        </div>
        <div className="price-card">
          <div className="price-nm">Básico</div>
          <div className="price-amt">{renderPriceAmount('basic')}</div>
          <div className="price-per">
            por mês
            {billingCycle === 'annually' && (
              <span className="price-per-context"> · no plano anual</span>
            )}
          </div>
          <hr className="price-div" />
          {renderVariantToggle('basic')}
          <ul className="price-feats">
            <li>{variantOf('basic') === 'solo' && planHasSolo('basic') ? '1 profissional' : 'Até 3 profissionais'}</li>
            <li>Agenda ilimitada</li>
            <li>Landing page pública da clínica</li>
            <li>Agendamento online (link na bio)</li>
            <li>Portal do Paciente</li>
            <li>Confirmações WhatsApp</li>
            <li>Lembrete de mensalidade por WhatsApp e Email</li>
            <li>Sessões recorrentes</li>
            <li>Venda de pacotes e orçamentos (com baixa automática no financeiro)</li>
            <li>Gestão de pacientes</li>
            <li>Ficha e histórico do paciente</li>
            <li>Dashboard financeiro e operacional</li>
            <li>Relatório de Caixa</li>
            <li>Onboarding guiado</li>
            <li>Suporte por e-mail</li>
          </ul>
          <button className="btn-p btn-p-out" onClick={() => handlePlanSelect('basic')}>Assinar agora</button>
        </div>
        <div className="price-card feat">
          <div className="feat-bdg">Recomendado</div>
          <div className="price-nm">Profissional</div>
          <div className="price-amt">{renderPriceAmount('professional')}</div>
          <div className="price-per">
            por mês
            {billingCycle === 'annually' && (
              <span className="price-per-context"> · no plano anual</span>
            )}
          </div>
          <hr className="price-div" />
          {renderVariantToggle('professional')}
          <ul className="price-feats">
            <li>{variantOf('professional') === 'solo' && planHasSolo('professional') ? '1 profissional' : 'Até 7 profissionais'}</li>
            <li>Tudo do Básico</li>
            <li>Pagamentos Online (PIX e Cartão)</li>
            <li>WhatsApp Oficial (sem risco de ban)</li>
            <li>IA que entende respostas do paciente</li>
            <li>Google Calendar bidirecional</li>
            <li>Teleconsulta (Google Meet)</li>
            <li>Lista de Espera Automática</li>
            <li>Detector de Risco de Faltas</li>
            <li>Relatórios de Prejuízo</li>
            <li>Recebíveis e Conciliação</li>
            <li>Personalização de mensagens</li>
            <li>Controle de acesso por perfil</li>
            <li>Suporte prioritário WhatsApp</li>
          </ul>
          <button className="btn-p btn-p-fill" onClick={() => handlePlanSelect('professional')}>Assinar agora</button>
        </div>
        <div className="price-card">
          <div className="price-nm">Avançado</div>
          <div className="price-amt">
            {renderPriceAmount('advanced')}
            <span className="price-unit">/Unidade</span>
          </div>
          <div className="price-per">
            por mês
            {billingCycle === 'annually' && (
              <span className="price-per-context"> · no plano anual</span>
            )}
          </div>
          <div className="units-stepper" role="group" aria-label="Quantidade de unidades">
            <span className="units-label">Unidades</span>
            <div className="units-ctrl">
              <button
                type="button"
                className="units-btn"
                aria-label="Diminuir unidades"
                onClick={() => setAdvancedUnits(u => Math.max(2, u - 1))}
                disabled={advancedUnits <= 2}
              >−</button>
              <span className="units-val" aria-live="polite">{advancedUnits}</span>
              <button
                type="button"
                className="units-btn"
                aria-label="Aumentar unidades"
                onClick={() => setAdvancedUnits(u => u + 1)}
              >+</button>
            </div>
          </div>
          <div className="units-total">
            Total:{' '}
            {advancedDiscountedTotal() ? (
              <>
                <strong>R$ {advancedDiscountedTotal()}</strong>
                <span className="units-total-original">R$ {advancedTotal()}</span>
              </>
            ) : (
              <strong>R$ {advancedTotal()}</strong>
            )}
            /mês
          </div>
          <hr className="price-div" />
          <ul className="price-feats">
            <li>Até 14 profissionais por unidade</li>
            <li>Tudo do Profissional</li>
            <li>Múltiplas unidades (filiais)</li>
            <li>Dashboard consolidado entre unidades</li>
            <li>Relatório comparativo de filiais</li>
            <li>Mínimo 2 unidades na contratação</li>
            <li>Relatórios avançados</li>
            <li>Onboarding com treinamento da equipe</li>
            <li>Importação de dados do sistema anterior</li>
            <li>API de integração</li>
            <li>Backup diário automático</li>
          </ul>
          <button className="btn-p btn-p-out" onClick={() => handlePlanSelect('advanced')}>Assinar agora</button>
        </div>
      </div>
    </section>
  )
}

// Client component for the CTA section at the bottom
export function CtaSection({ lng, publicConfig: initialConfig = null }: LandingClientProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(initialConfig)

  useEffect(() => {
    if (publicConfig) return
    const fetchConfig = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
        const response = await fetch(`${baseUrl}/api/v1/public/config`, { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          setPublicConfig(data)
        }
      } catch (err) {}
    }
    fetchConfig()
  }, [publicConfig])

  const getTrialDays = (): number => publicConfig?.trial_days || 14

  const handlePlanSelect = (plan: string) => {
    trackPlanLead({ plan: plan as PlanKey, billingCycle: 'monthly', publicConfig })
    // Plan-click is product-selection intent, not a captured lead. Using
    // `generate_lead` here was double-counting against the contact/kit forms
    // and pointing Google Ads at the wrong conversion (algo optimized for
    // CTA clicks instead of real leads).
    gtagEvent('select_item', { item_list_id: 'pricing', item_id: plan })
    const target = isAuthenticated ? 'billing-setup' : 'register'
    const url = new URL(`/${lng}/${target}`, window.location.origin)
    url.searchParams.set('plan', plan)
    url.searchParams.set('billing', 'MONTHLY')

    const currentParams = new URLSearchParams(window.location.search)
    const offer = currentParams.get('offer')
    if (offer) url.searchParams.set('offer', offer)

    router.push(url.pathname + url.search)
  }

  return (
    <section className="cta-sec">
      <h2 className="display-title">Sua clínica merece parar<br/>de perder dinheiro com faltas.</h2>
      <p className="cta-p">Comece grátis. Sem cartão. Sem compromisso.</p>
      <div className="cta-acts">
        <button className="btn-cta-w" onClick={() => handlePlanSelect('trial')}>Testar grátis por {getTrialDays()} dias &rarr;</button>
        <a href="#como-funciona" className="btn-cta-o">Ver como funciona</a>
      </div>
      <p className="cta-note">Ativação imediata. Funciona no celular.</p>
    </section>
  )
}
