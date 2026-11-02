'use client'

import { useState } from 'react'
import { gtagEvent, gtagReportLeadConversion } from '@/lib/gtag'
import { trackEvent, PIXEL_CURRENCY } from '@/lib/meta-pixel'

interface InlineEmailCaptureProps {
  title?: string
  cta?: string
  origem?: string
  benefits?: string[]
}

const DEFAULT_BENEFITS = [
  '14 dias de teste, sem cartão de crédito',
  'E-mail verificado automaticamente pelo clique no link',
  'Sem instalar nada, funciona direto no navegador',
  'Cancela quando quiser, sem multa nem ligação',
]

export function InlineEmailCapture({
  title = 'Receba seu link de acesso ao sistema por e-mail.',
  cta = 'Receber link de acesso',
  origem = 'landing_inline_hero',
  benefits = DEFAULT_BENEFITS,
}: InlineEmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Fire Lead attribution on click (before the network request) so Meta/Google
    // get the conversion even if the API is slow or the user navigates away.
    const leadValue = Number(process.env.NEXT_PUBLIC_KIT_PLANILHAS_LEAD_VALUE) || 1
    trackEvent(
      'Lead',
      {
        content_name: origem,
        content_category: 'lead_magnet',
        value: leadValue,
        currency: PIXEL_CURRENCY,
      },
      { email },
    )
    gtagEvent('generate_lead', { source: origem })
    gtagReportLeadConversion({ source: origem })

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
      const res = await fetch(`${baseUrl}/api/v1/leads/landing-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          origem,
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

  return (
    <section className="iec-wrap" aria-label="Receber link de acesso">
      <div className="iec-grid">
        <div className="iec-left">
          <h2 className="iec-title">{title}</h2>
          <ul className="iec-bullets">
            {benefits.map((b) => (
              <li key={b}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="iec-right">
          {submitted ? (
            <div className="iec-success-card">
              <div className="iec-success-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="iec-success-title">Pronto.</p>
              <p className="iec-success-sub">Olha seu e-mail em instantes. Se não chegar, confere o spam.</p>
            </div>
          ) : (
            <form className="iec-form-card" onSubmit={submit} noValidate>
              <label htmlFor="iec-email" className="iec-label">Seu melhor e-mail</label>
              <input
                id="iec-email"
                className="iec-input-block"
                type="email"
                placeholder="voce@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <button className="iec-btn-block" type="submit" disabled={submitting || !email}>
                {submitting ? 'Enviando…' : (
                  <>
                    {cta}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
              {error && <p className="iec-err">{error}</p>}
              <p className="iec-foot">Sem spam. Sem compromisso.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
