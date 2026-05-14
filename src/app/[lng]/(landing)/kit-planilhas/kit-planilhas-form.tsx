'use client'

import { useState, useCallback } from 'react'
import { gtagEvent, gtagReportLeadConversion } from '@/lib/gtag'
import { trackEvent, PIXEL_CURRENCY } from '@/lib/meta-pixel'

function formatWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, '')

  // With country code: +55 (XX) XXXXX-XXXX (13 digits)
  if (digits.length > 11) {
    const v = digits.slice(0, 13)
    const cc = v.slice(0, 2)
    const ddd = v.slice(2, 4)
    const part1 = v.slice(4, 9)
    const part2 = v.slice(9)
    if (v.length > 9) return `+${cc} (${ddd}) ${part1}-${part2}`
    if (v.length > 4) return `+${cc} (${ddd}) ${v.slice(4)}`
    if (v.length > 2) return `+${cc} (${v.slice(2)}`
    return `+${cc}`
  }

  // Without country code: (XX) XXXXX-XXXX (11 digits)
  const v = digits.slice(0, 11)
  if (v.length > 6) return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7)
  if (v.length > 2) return '(' + v.slice(0, 2) + ') ' + v.slice(2)
  if (v.length > 0) return '(' + v
  return v
}

export function KitPlanilhasForm() {
  const [formData, setFormData] = useState({ nome: '', email: '', whatsapp: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
      const res = await fetch(`${baseUrl}/api/v1/leads/isca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          whatsapp: formData.whatsapp,
          origem: 'isca_kit_planilhas',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Erro ao enviar')
      }

      // Lead magnet: valor estimado configurável via env (default = 1 BRL apenas para
      // satisfazer a exigência da Meta de value > 0). trackEvent já dispara o
      // pixel browser e o mirror CAPI com o mesmo event_id pra deduplicação.
      const leadValue = Number(process.env.NEXT_PUBLIC_KIT_PLANILHAS_LEAD_VALUE) || 1
      trackEvent(
        'Lead',
        {
          content_name: 'kit_planilhas',
          content_category: 'lead_magnet',
          value: leadValue,
          currency: PIXEL_CURRENCY,
        },
        {
          email: formData.email,
          phone: formData.whatsapp,
        },
      )
      gtagEvent('generate_lead', { source: 'kit_planilhas' })
      gtagReportLeadConversion({ source: 'kit_planilhas' })

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.')
      setIsSubmitting(false)
    }
  }, [formData])

  if (submitted) {
    return (
      <div className="kp-success-state">
        <div className="kp-success-icon">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <p className="kp-success-title">Kit enviado!</p>
        <p className="kp-success-txt">Verifique seu e-mail em instantes. Caso não encontre, cheque a caixa de spam.</p>
        <p className="kp-success-sub">Bom uso das planilhas</p>
      </div>
    )
  }

  return (
    <>
      {error && <div className="kp-error">{error}</div>}

      <p className="kp-form-title">Receba o kit no seu e-mail</p>
      <p className="kp-form-sub">Preencha abaixo — leva menos de 30 segundos</p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="kp-nome">Nome</label>
        <input
          type="text"
          id="kp-nome"
          placeholder="Seu nome completo"
          required
          autoComplete="name"
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
        />

        <label htmlFor="kp-email">E-mail</label>
        <input
          type="email"
          id="kp-email"
          placeholder="seu@email.com"
          required
          autoComplete="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />

        <label htmlFor="kp-whatsapp">WhatsApp</label>
        <input
          type="tel"
          id="kp-whatsapp"
          placeholder="(11) 99999-9999"
          autoComplete="tel"
          value={formData.whatsapp}
          onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: formatWhatsApp(e.target.value) }))}
        />

        <button type="submit" className="kp-btn-cta" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Quero receber grátis'}
          {!isSubmitting && (
            <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          )}
        </button>
      </form>

      <p className="kp-form-disclaimer">Ao preencher, você concorda em receber o kit e comunicações da Aseno. Você pode cancelar a qualquer momento.</p>
    </>
  )
}

export function ScrollToFormLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    document.getElementById('kp-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <a href="#kp-form" className={className} onClick={handleClick}>
      {children}
    </a>
  )
}
