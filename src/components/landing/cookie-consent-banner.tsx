'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getConsent,
  setConsent,
  onReopenRequest,
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

  // Banner é apenas informativo no momento — o tracking carrega desde o load
  // da página independente da escolha. "Entendi" persiste a decisão pra não
  // reaparecer (cookie de 12 meses).
  const acknowledge = () => {
    setConsent('all')
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
            Aviso de cookies
          </p>
          <p id="cookie-banner-desc" className="cookie-banner-desc">
            <span className="cookie-banner-desc-long">
              Este site usa cookies essenciais para funcionar e cookies de
              análise e marketing (Google, Meta) para medir desempenho e
              entender como você usa a plataforma.{' '}
            </span>
            <span className="cookie-banner-desc-short">
              Este site usa cookies.{' '}
            </span>
            <Link href="/privacidade" className="cookie-banner-link">
              Saiba mais
            </Link>
            .
          </p>
        </div>
        <div className="cookie-banner-actions">
          <button
            type="button"
            className="cookie-banner-btn cookie-banner-btn-primary"
            onClick={acknowledge}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
