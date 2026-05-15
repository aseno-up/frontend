'use client'

import { useEffect, useState, useCallback } from 'react'
import { gtagEvent, gtagReportLeadConversion } from '@/lib/gtag'
import { trackEvent, PIXEL_CURRENCY } from '@/lib/meta-pixel'

interface EngagementModalProps {
  lng: string
}

const SHOWN_KEY = 'aseno_engagement_modal_shown'
const TIME_TRIGGER_MS = 55_000
const INACTIVITY_TRIGGER_MS = 25_000
const SCROLL_TRIGGER_PCT = 0.8

export function EngagementModal({ lng: _lng }: EngagementModalProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionStorage.getItem(SHOWN_KEY) === '1') return

    let inactivityTimer: number | undefined
    let timeTimer: number | undefined
    let opened = false
    let exitBound = false

    const trigger = (source: string) => {
      if (opened) return
      opened = true
      sessionStorage.setItem(SHOWN_KEY, '1')
      gtagEvent('engagement_modal_open', { trigger: source })
      setOpen(true)
      cleanup()
    }

    const resetInactivity = () => {
      if (inactivityTimer !== undefined) window.clearTimeout(inactivityTimer)
      inactivityTimer = window.setTimeout(() => trigger('inactivity'), INACTIVITY_TRIGGER_MS)
    }

    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight
      if (docH <= 0) return
      const pct = window.scrollY / docH
      if (pct >= SCROLL_TRIGGER_PCT) trigger('scroll_depth')
    }

    const onExitIntent = (e: MouseEvent) => {
      if (e.clientY <= 0 && e.relatedTarget === null) trigger('exit_intent')
    }

    const cleanup = () => {
      if (inactivityTimer !== undefined) window.clearTimeout(inactivityTimer)
      if (timeTimer !== undefined) window.clearTimeout(timeTimer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', resetInactivity)
      window.removeEventListener('touchstart', resetInactivity)
      window.removeEventListener('keydown', resetInactivity)
      if (exitBound) document.removeEventListener('mouseout', onExitIntent)
    }

    timeTimer = window.setTimeout(() => trigger('time_on_page'), TIME_TRIGGER_MS)
    resetInactivity()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', resetInactivity, { passive: true })
    window.addEventListener('touchstart', resetInactivity, { passive: true })
    window.addEventListener('keydown', resetInactivity)
    if (window.matchMedia('(hover: hover)').matches) {
      document.addEventListener('mouseout', onExitIntent)
      exitBound = true
    }

    return cleanup
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    gtagEvent('engagement_modal_close', { submitted: submitted ? 1 : 0 })
  }, [submitted])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Fire Lead attribution on click (before fetch) so Meta/Google get the
    // conversion even if the API stalls.
    const leadValue = Number(process.env.NEXT_PUBLIC_KIT_PLANILHAS_LEAD_VALUE) || 1
    trackEvent(
      'Lead',
      {
        content_name: 'landing_modal',
        content_category: 'lead_magnet',
        value: leadValue,
        currency: PIXEL_CURRENCY,
      },
      { email },
    )
    gtagEvent('generate_lead', { source: 'landing_modal' })
    gtagReportLeadConversion({ source: 'landing_modal' })

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
      const res = await fetch(`${baseUrl}/api/v1/leads/landing-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          origem: 'landing_modal',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Erro ao enviar')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.')
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="eng-overlay" role="dialog" aria-modal="true" aria-labelledby="eng-title" onClick={close}>
      <div className="eng-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="eng-close" aria-label="Fechar" onClick={close}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <div className="eng-content">
          {submitted ? (
            <div className="eng-success">
              <div className="eng-success-icon">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h3 className="eng-title">Pronto.</h3>
              <p className="eng-sub">Em instantes você recebe seu link no e-mail. Olha a caixa de spam se não encontrar.</p>
            </div>
          ) : (
            <>
              <h3 id="eng-title" className="eng-title">Receba seu link de acesso ao sistema por e-mail.</h3>
              <p className="eng-sub">14 dias de teste, sem cartão de crédito.</p>



              {error && <p className="iec-err" style={{ marginBottom: '.5rem' }}>{error}</p>}

              <form className="eng-form" onSubmit={submit} noValidate>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  aria-label="Seu e-mail"
                />
                <button type="submit" disabled={submitting || !email}>
                  {submitting ? 'Enviando…' : (
                    <>
                      Receber link
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <p className="eng-foot">Ao enviar você concorda em receber comunicações da Aseno. Pode cancelar a qualquer momento.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
