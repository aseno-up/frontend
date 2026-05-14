'use client'

import { useState } from 'react'
import { gtagEvent, gtagReportLeadConversion } from '@/lib/gtag'
import { trackEvent, FALLBACK_CONFIG, PIXEL_CURRENCY } from '@/lib/meta-pixel'

export function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
      const res = await fetch(`${baseUrl}/api/v1/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Erro ao enviar mensagem')
      }

      // Predicted lead value = professional plan monthly. Meta + GA + Google
      // Ads all expect `value`/`currency` on lead events to compute CPL and
      // optimize bidding.
      const leadValue = FALLBACK_CONFIG.plans.professional.price_monthly
      trackEvent(
        'Lead',
        {
          content_name: 'contact_form',
          content_category: 'inbound_contact',
          value: leadValue,
          currency: PIXEL_CURRENCY,
        },
        { email: formData.email },
      )
      gtagEvent('generate_lead', {
        source: 'contact_form',
        value: leadValue,
        currency: PIXEL_CURRENCY,
      })
      gtagReportLeadConversion({
        source: 'contact_form',
        value: leadValue,
        currency: PIXEL_CURRENCY,
      })

      setSubmitted(true)
      setFormData({ name: '', email: '', message: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {submitted ? (
        <div className="contact-success">
          Mensagem enviada com sucesso! Entraremos em contato em breve.
        </div>
      ) : (
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-field">
            <label htmlFor="name">Nome</label>
            <input
              id="name"
              type="text"
              placeholder="Seu nome"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="contact-field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="contact-field">
            <label htmlFor="message">Mensagem</label>
            <textarea
              id="message"
              placeholder="Como podemos ajudar?"
              required
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            />
          </div>

          <button type="submit" className="contact-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar mensagem'}
          </button>
        </form>
      )}
    </>
  )
}
