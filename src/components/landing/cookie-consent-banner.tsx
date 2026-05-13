'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getConsent,
  setConsent,
  onReopenRequest,
  type CookieConsent,
} from '@/lib/cookie-consent'

export function CookieConsentBanner() {
  // Sempre escondido na primeira renderização (SSR) — evita flash e CLS.
  // Mostramos só depois de ler o cookie no cliente.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (getConsent() === null) setVisible(true)
    const off = onReopenRequest(() => setVisible(true))
    return off
  }, [])

  if (!visible) return null

  const choose = (value: CookieConsent) => {
    setConsent(value)
    setVisible(false)
  }

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div className="cookie-banner-inner">
        <div className="cookie-banner-text">
          <p id="cookie-banner-title" className="cookie-banner-title">
            Sua privacidade
          </p>
          <p id="cookie-banner-desc" className="cookie-banner-desc">
            Usamos cookies essenciais para o login e funcionamento do site, e
            cookies de análise e marketing (Google, Meta) para entender como
            você usa a plataforma. Você decide.{' '}
            <Link href="/privacidade" className="cookie-banner-link">
              Saiba mais
            </Link>
            .
          </p>
        </div>
        <div className="cookie-banner-actions">
          <button
            type="button"
            className="cookie-banner-btn cookie-banner-btn-secondary"
            onClick={() => choose('essential')}
          >
            Apenas essenciais
          </button>
          <button
            type="button"
            className="cookie-banner-btn cookie-banner-btn-primary"
            onClick={() => choose('all')}
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  )
}
