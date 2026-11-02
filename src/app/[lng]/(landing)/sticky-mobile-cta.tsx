'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { gtagEvent } from '@/lib/gtag'
import { trackPlanLead, type PlanKey, type PublicConfig } from '@/lib/meta-pixel'

interface StickyMobileCTAProps {
  lng: string
  publicConfig?: PublicConfig | null
}

const DISMISS_KEY = 'aseno_sticky_cta_dismissed'

export function StickyMobileCTA({ lng, publicConfig = null }: StickyMobileCTAProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true)
      return
    }

    const onScroll = () => {
      if (window.scrollY > 320) setVisible(true)
      else setVisible(false)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (dismissed) return null

  const trialDays = publicConfig?.trial_days || 14

  const handleClick = () => {
    trackPlanLead({ plan: 'trial' as PlanKey, billingCycle: 'monthly', publicConfig })
    gtagEvent('select_item', { item_list_id: 'sticky_mobile_cta', item_id: 'trial' })
    const target = isAuthenticated ? 'billing-setup' : 'register'
    const url = new URL(`/${lng}/${target}`, window.location.origin)
    url.searchParams.set('plan', 'trial')
    url.searchParams.set('billing', 'MONTHLY')
    const offer = new URLSearchParams(window.location.search).get('offer')
    if (offer) url.searchParams.set('offer', offer)
    router.push(url.pathname + url.search)
  }

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className={`sticky-mobile-cta ${visible ? 'show' : ''}`} role="region" aria-label="Testar grátis">
      <button type="button" className="smc-close" aria-label="Fechar" onClick={handleDismiss}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>
      <div className="smc-text">
        <strong>{trialDays} dias grátis</strong>
        <span>sem cartão de crédito</span>
      </div>
      <button type="button" className="smc-btn" onClick={handleClick}>
        Testar grátis
      </button>
    </div>
  )
}
