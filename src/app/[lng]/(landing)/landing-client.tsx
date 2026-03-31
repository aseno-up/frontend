'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

interface PublicConfig {
  trial_days: number
  plans: {
    [key: string]: {
      limit_professionals: number
      price_monthly: number
      price_yearly: number
      excess_price: number
    }
  }
}

interface LandingClientProps {
  lng: string
}

// Client component for interactive hero CTA buttons
export function HeroCTA({ lng }: LandingClientProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null)

  useEffect(() => {
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
  }, [])

  const getTrialDays = (): number => publicConfig?.trial_days || 14

  const handlePlanSelect = (plan: string) => {
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
      <a href="#como-funciona" className="btn-lg-out">Ver demonstração</a>
    </div>
  )
}

// Client component for the navigation CTA buttons
export function NavCTA({ lng }: LandingClientProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null)

  useEffect(() => {
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
  }, [])

  const handlePlanSelect = (plan: string) => {
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
export function PricingSection({ lng }: LandingClientProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually')
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null)

  useEffect(() => {
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
  }, [])

  const getTrialDays = (): number => publicConfig?.trial_days || 14

  const calculateMonthlyPrice = (plan: 'basic' | 'professional' | 'advanced') => {
    if (!publicConfig) return '—'
    const planData = publicConfig.plans[plan]
    if (!planData) return '—'
    if (billingCycle === 'monthly') return planData.price_monthly.toString()
    if (planData.price_yearly > 0) {
      return Math.round(planData.price_yearly / 12).toString()
    }
    return Math.round((planData.price_monthly * 10) / 12).toString()
  }

  const handlePlanSelect = (plan: string) => {
    const target = isAuthenticated ? 'billing-setup' : 'register'
    const url = new URL(`/${lng}/${target}`, window.location.origin)
    url.searchParams.set('plan', plan)

    let cycle = billingCycle === 'annually' ? 'YEARLY' : 'MONTHLY'
    if (plan === 'trial') cycle = 'MONTHLY'

    url.searchParams.set('billing', cycle)

    const currentParams = new URLSearchParams(window.location.search)
    const offer = currentParams.get('offer')
    if (offer) url.searchParams.set('offer', offer)

    router.push(url.pathname + url.search)
  }

  return (
    <section className="sec sec-alt" id="precos">
      <div className="sec-hd">
        <span className="eyebrow">Planos</span>
        <h2 className="sec-title">Simples e <span className="a1">transparente</span></h2>
        <p className="sec-sub">Preço por clínica, não por profissional. {getTrialDays()} dias grátis no plano Profissional.</p>
      </div>
      <div className="ptoggle">
        <span style={{ fontWeight: billingCycle === 'monthly' ? 600 : 500, color: billingCycle === 'monthly' ? 'var(--ink)' : 'var(--ink-light)' }}>Mensal</span>
        <button className={`toggle-pill ${billingCycle === 'annually' ? 'active' : ''}`} onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}><div className="toggle-thumb"></div></button>
        <span style={{ fontWeight: billingCycle === 'annually' ? 600 : 500, color: billingCycle === 'annually' ? 'var(--ink)' : 'var(--ink-light)' }}>Anual {billingCycle === 'annually' && <span className="toggle-bdg">2 meses grátis</span>}</span>
      </div>
      <div className="price-grid">
        <div className="price-card">
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
          <div className="price-amt"><sup>R$</sup> {calculateMonthlyPrice('basic')}</div>
          <div className="price-per">por mês</div>
          <hr className="price-div" />
          <ul className="price-feats">
            <li>Até 5 profissionais</li>
            <li>Agenda ilimitada</li>
            <li>Landing page pública da clínica</li>
            <li>Agendamento online (link na bio)</li>
            <li>Portal do Paciente</li>
            <li>Confirmações WhatsApp</li>
            <li>Sessões recorrentes</li>
            <li>Gestão de pacientes</li>
            <li>Ficha e histórico do paciente</li>
            <li>Dashboard financeiro e operacional</li>
            <li>Onboarding guiado</li>
            <li>Suporte por e-mail</li>
          </ul>
          <button className="btn-p btn-p-out" onClick={() => handlePlanSelect('basic')}>Assinar agora</button>
        </div>
        <div className="price-card feat">
          <div className="feat-bdg">Recomendado</div>
          <div className="price-nm">Profissional</div>
          <div className="price-amt"><sup>R$</sup> {calculateMonthlyPrice('professional')}</div>
          <div className="price-per">por mês</div>
          <hr className="price-div" />
          <ul className="price-feats">
            <li>Até 15 profissionais</li>
            <li>Tudo do Básico</li>
            <li>Pagamentos Online (PIX e Cartão)</li>
            <li>WhatsApp Oficial (sem risco de ban)</li>
            <li>IA que entende respostas do paciente</li>
            <li>Google Calendar bidirecional</li>
            <li>Teleconsulta (Google Meet)</li>
            <li>Lista de Espera Automática</li>
            <li>Detector de Risco de Faltas</li>
            <li>Relatórios de Prejuízo</li>
            <li>Personalização de mensagens</li>
            <li>Controle de acesso por perfil</li>
            <li>Suporte prioritário WhatsApp</li>
          </ul>
          <button className="btn-p btn-p-fill" onClick={() => handlePlanSelect('professional')}>Assinar agora</button>
        </div>
        <div className="price-card">
          <div className="price-nm">Avançado</div>
          <div className="price-amt"><sup>R$</sup> {calculateMonthlyPrice('advanced')}</div>
          <div className="price-per">por mês</div>
          <hr className="price-div" />
          <ul className="price-feats">
            <li>Profissionais ilimitados</li>
            <li>Tudo do Profissional</li>
            <li>Múltiplas unidades (filiais)</li>
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
export function CtaSection({ lng }: LandingClientProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null)

  useEffect(() => {
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
  }, [])

  const getTrialDays = (): number => publicConfig?.trial_days || 14

  const handlePlanSelect = (plan: string) => {
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
      <h2 className="sec-title">Pronto para reduzir<br/>as faltas na sua clínica?</h2>
      <p className="cta-p">Junte-se a centenas de clínicas que já transformaram sua gestão com o Aseno.</p>
      <div className="cta-acts">
        <button className="btn-cta-w" onClick={() => handlePlanSelect('trial')}>Testar grátis por {getTrialDays()} dias &rarr;</button>
        <a href="#como-funciona" className="btn-cta-o">Ver demonstração</a>
      </div>
      <p className="cta-note">Sem cartão de crédito. Ativação imediata.</p>
    </section>
  )
}
