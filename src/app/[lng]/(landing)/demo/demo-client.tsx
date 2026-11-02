'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { gtagEvent, gtagReportDemoToRegister } from '@/lib/gtag'

type Scenario = 'confirm' | 'reschedule' | 'cancel' | 'payment'
type Service =
  | 'Pilates'
  | 'Fisioterapia'
  | 'Psicologia'
  | 'Estética'
  | 'Massoterapia'
  | 'Nutrição'

interface BubbleStep {
  kind: 'in' | 'out'
  text: string
  delayBefore: number
  typingMs: number
}

interface DemoClientProps {
  lng: string
}

const SERVICES: Service[] = [
  'Pilates',
  'Fisioterapia',
  'Psicologia',
  'Estética',
  'Massoterapia',
  'Nutrição',
]

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function formatDateBR(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}`
}

function weekdayBR(iso: string): string {
  if (!iso) return ''
  const dt = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(dt.getTime())) return ''
  const wd = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
  return wd[dt.getDay()]
}

function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function nowHHMM(): string {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function timeLabel(offsetMin = 0): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() + offsetMin)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function rescheduledISO(originalISO: string): { iso: string; weekday: string } {
  const base = originalISO ? new Date(`${originalISO}T12:00:00`) : new Date()
  if (Number.isNaN(base.getTime())) return { iso: originalISO, weekday: '' }
  base.setDate(base.getDate() + 2)
  const iso = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`
  return { iso, weekday: weekdayBR(iso) }
}

const SERVICE_PRICE_BRL: Record<Service, number> = {
  Pilates: 120,
  Fisioterapia: 150,
  Psicologia: 180,
  'Estética': 250,
  Massoterapia: 130,
  'Nutrição': 200,
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

export function DemoClient({ lng }: DemoClientProps) {
  const router = useRouter()
  const [patientName, setPatientName] = useState('Maria')
  const [clinicName, setClinicName] = useState('Clínica Vitalitá')
  const [service, setService] = useState<Service>('Pilates')
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState('14:00')
  const [scenario, setScenario] = useState<Scenario>('confirm')

  const [visibleBubbles, setVisibleBubbles] = useState<BubbleStep[]>([])
  const [typing, setTyping] = useState<'in' | 'out' | null>(null)
  const [played, setPlayed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [statusAnimating, setStatusAnimating] = useState(false)
  const timeoutsRef = useRef<number[]>([])
  const phoneFrameRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDate(tomorrowISO())
  }, [])

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id))
    timeoutsRef.current = []
  }, [])

  useEffect(() => () => clearTimeouts(), [clearTimeouts])

  // Reset chat when the user changes any input or scenario
  useEffect(() => {
    clearTimeouts()
    setVisibleBubbles([])
    setTyping(null)
    setPlayed(false)
    setPlaying(false)
    setStatusAnimating(false)
  }, [patientName, clinicName, service, date, time, scenario, clearTimeouts])

  const safeName = patientName.trim() || 'paciente'
  const safeClinic = clinicName.trim() || 'sua clínica'
  const dateBR = formatDateBR(date) || '--/--'
  const wd = weekdayBR(date)
  const reschedule = useMemo(() => rescheduledISO(date), [date])

  const steps: BubbleStep[] = useMemo(() => {
    const reminder = `Oi ${safeName}! Aqui é da ${safeClinic} 💙 Confirmando sua sessão de ${service} ${wd ? `na ${wd}, ` : ''}dia ${dateBR} às ${time || '--:--'}. Você consegue comparecer?`

    if (scenario === 'confirm') {
      return [
        { kind: 'in', text: reminder, delayBefore: 350, typingMs: 1400 },
        { kind: 'out', text: 'Confirmado! Estarei aí no horário 🙂', delayBefore: 700, typingMs: 1300 },
        {
          kind: 'in',
          text: `Combinado, ${safeName}! Sua presença está confirmada para ${dateBR} às ${time || '--:--'}. Te espero! ✨`,
          delayBefore: 700,
          typingMs: 1400,
        },
      ]
    }

    if (scenario === 'reschedule') {
      return [
        { kind: 'in', text: reminder, delayBefore: 350, typingMs: 1400 },
        {
          kind: 'out',
          text: 'Vou levar minha filha na escola e não consigo nesse horário. Tem alguma vaga na quinta de tarde?',
          delayBefore: 700,
          typingMs: 1900,
        },
        {
          kind: 'in',
          text: `Sem problema, ${safeName}! Encontrei um horário na ${reschedule.weekday || 'quinta'}, ${formatDateBR(reschedule.iso)} às 15:00. Posso reservar?`,
          delayBefore: 800,
          typingMs: 1600,
        },
        { kind: 'out', text: 'Perfeito, pode reservar! Obrigada 🙏', delayBefore: 600, typingMs: 1200 },
        {
          kind: 'in',
          text: `Pronto, agenda atualizada. Te mando um novo lembrete um dia antes. Até a ${reschedule.weekday || 'quinta'}!`,
          delayBefore: 700,
          typingMs: 1400,
        },
      ]
    }

    if (scenario === 'cancel') {
      return [
        { kind: 'in', text: reminder, delayBefore: 350, typingMs: 1400 },
        {
          kind: 'out',
          text: 'Infelizmente não vou conseguir, surgiu um compromisso de última hora 😔',
          delayBefore: 700,
          typingMs: 1700,
        },
        {
          kind: 'in',
          text: `Tudo bem, ${safeName}. Cancelei seu horário e já avisei a lista de espera — alguém pode aproveitar a vaga. Quando quiser remarcar, é só me chamar por aqui.`,
          delayBefore: 800,
          typingMs: 1800,
        },
      ]
    }

    // scenario === 'payment'
    const priceVal = SERVICE_PRICE_BRL[service]
    const priceBRL = formatBRL(priceVal)
    return [
      { kind: 'in', text: reminder, delayBefore: 350, typingMs: 1400 },
      {
        kind: 'out',
        text: 'Vou sim! Aproveitando: como faço o pagamento dessa sessão?',
        delayBefore: 700,
        typingMs: 1500,
      },
      {
        kind: 'in',
        text: `Te mando o PIX, ${safeName} 💳\n${service} · ${priceBRL}\nChave: 00020126360014BR.GOV.BCB.PIX...`,
        delayBefore: 800,
        typingMs: 1700,
      },
      {
        kind: 'out',
        text: 'Acabei de pagar 💸',
        delayBefore: 900,
        typingMs: 1100,
      },
      {
        kind: 'in',
        text: `Pagamento de ${priceBRL} confirmado às ${timeLabel(0)} ✅ Recibo enviado pelo WhatsApp, sua presença está garantida. Saldo do pacote: 4/10 sessões. Te espero ${wd ? `na ${wd}` : 'no dia'}!`,
        delayBefore: 700,
        typingMs: 1900,
      },
    ]
  }, [safeName, safeClinic, service, wd, dateBR, time, scenario, reschedule])

  const play = useCallback(() => {
    clearTimeouts()
    setVisibleBubbles([])
    setTyping(null)
    setPlayed(false)
    setPlaying(true)
    setStatusAnimating(false)

    // On narrow screens, the phone is below the form — bring it into view
    // so the user actually sees the conversation animation start.
    // We compute the offset ourselves (window.scrollTo) instead of
    // scrollIntoView, because ancestors with overflow-x:hidden can hijack the
    // scroll container and silently swallow the call.
    if (typeof window !== 'undefined' && window.innerWidth <= 920 && phoneFrameRef.current) {
      const el = phoneFrameRef.current
      const navH = 64
      const launchBar = document.querySelector<HTMLElement>('.launch-bar')
      const launchBarH = launchBar ? launchBar.offsetHeight : 0
      const y = el.getBoundingClientRect().top + window.scrollY - navH - launchBarH - 12
      window.scrollTo({ top: y, behavior: 'smooth' })
    }

    let acc = 0
    steps.forEach((step, idx) => {
      acc += step.delayBefore
      const showTypingAt = acc
      timeoutsRef.current.push(
        window.setTimeout(() => setTyping(step.kind), showTypingAt)
      )
      acc += step.typingMs
      const showBubbleAt = acc
      timeoutsRef.current.push(
        window.setTimeout(() => {
          setTyping(null)
          setVisibleBubbles((b) => [...b, step])
          if (idx === steps.length - 1) {
            setPlayed(true)
            setPlaying(false)
            setStatusAnimating(true)
            window.setTimeout(() => setStatusAnimating(false), 1500)
          }
        }, showBubbleAt)
      )
    })

    gtagEvent('demo_play', { scenario })
  }, [steps, scenario, clearTimeouts])

  const reset = useCallback(() => {
    clearTimeouts()
    setVisibleBubbles([])
    setTyping(null)
    setPlayed(false)
    setPlaying(false)
    setStatusAnimating(false)
  }, [clearTimeouts])

  const statusLabel: { text: string; tone: 'confirm' | 'reschedule' | 'cancel' | 'payment' } =
    scenario === 'confirm'
      ? { text: 'Confirmado', tone: 'confirm' }
      : scenario === 'reschedule'
      ? { text: 'Reagendado', tone: 'reschedule' }
      : scenario === 'cancel'
      ? { text: 'Cancelado', tone: 'cancel' }
      : { text: 'Pago', tone: 'payment' }

  const handleCTAClick = () => {
    gtagEvent('demo_to_register', { scenario })
    gtagReportDemoToRegister({ scenario })
    router.push(`/${lng}/register?plan=trial&billing=MONTHLY&source=demo`)
  }

  return (
    <section className="demo-stage">
      <div className="demo-inner-grid">
        {/* ─── FORM ─── */}
        <div className="demo-form-card">
          <div className="demo-form-eyebrow">Monte um lembrete real</div>
          <h2 className="demo-form-title">Os dados que você digitar viram a mensagem do WhatsApp.</h2>
          <p className="demo-form-sub">Sem cadastro. Sem cartão. Sem login.</p>

          <div className="demo-fields">
            <label className="demo-field">
              <span className="demo-field-lbl">Paciente</span>
              <input
                type="text"
                className="demo-input"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Maria"
                maxLength={48}
              />
            </label>

            <label className="demo-field">
              <span className="demo-field-lbl">Clínica</span>
              <input
                type="text"
                className="demo-input"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Sua Clínica"
                maxLength={48}
              />
            </label>

            <label className="demo-field">
              <span className="demo-field-lbl">Serviço</span>
              <div className="demo-select-wrap">
                <select
                  className="demo-input demo-select"
                  value={service}
                  onChange={(e) => setService(e.target.value as Service)}
                >
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <svg className="demo-select-arrow" width="10" height="6" viewBox="0 0 10 6" aria-hidden>
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </label>

            <div className="demo-field-row">
              <label className="demo-field">
                <span className="demo-field-lbl">Data</span>
                <input
                  type="date"
                  className="demo-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label className="demo-field">
                <span className="demo-field-lbl">Hora</span>
                <input
                  type="time"
                  className="demo-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="demo-scenarios">
            <span className="demo-field-lbl">O paciente vai responder...</span>
            <div className="demo-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={scenario === 'confirm'}
                className={`demo-tab ${scenario === 'confirm' ? 'active' : ''}`}
                onClick={() => setScenario('confirm')}
              >
                ✅ Confirmando
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={scenario === 'reschedule'}
                className={`demo-tab ${scenario === 'reschedule' ? 'active' : ''}`}
                onClick={() => setScenario('reschedule')}
              >
                🔁 Reagendando
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={scenario === 'cancel'}
                className={`demo-tab ${scenario === 'cancel' ? 'active' : ''}`}
                onClick={() => setScenario('cancel')}
              >
                ❌ Cancelando
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={scenario === 'payment'}
                className={`demo-tab ${scenario === 'payment' ? 'active' : ''}`}
                onClick={() => setScenario('payment')}
              >
                💳 Pagando via PIX
              </button>
            </div>
            <p className="demo-scenario-hint">
              {scenario === 'confirm' && 'Resposta direta. A IA fixa o horário e te avisa.'}
              {scenario === 'reschedule' && 'Texto livre, com motivo humano. A IA entende e sugere outro horário.'}
              {scenario === 'cancel' && 'Cancelamento de última hora. A IA libera a vaga pra lista de espera.'}
              {scenario === 'payment' && 'Cobrança via PIX direto no WhatsApp. Baixa, recibo e saldo de sessões — automáticos.'}
            </p>
          </div>

          <div className="demo-actions">
            <button
              type="button"
              className="demo-btn-primary"
              onClick={play}
              disabled={playing}
            >
              {playing ? 'Reproduzindo...' : played ? '↻ Reproduzir de novo' : 'Disparar lembrete →'}
            </button>
            {(played || playing) && (
              <button type="button" className="demo-btn-ghost" onClick={reset} disabled={playing}>
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* ─── PHONE ─── */}
        <div className="demo-phone-col">
          <div className="demo-phone-frame" aria-live="polite" ref={phoneFrameRef}>
            <div className="demo-phone-notch" />
            <div className="demo-phone-screen">
              <div className="demo-wa-header">
                <button className="demo-wa-back" aria-label="Voltar">‹</button>
                <div className="demo-wa-avatar">
                  {safeClinic.charAt(0).toUpperCase()}
                </div>
                <div className="demo-wa-id">
                  <div className="demo-wa-name">{safeClinic}</div>
                  <div className="demo-wa-status">
                    <span className="demo-wa-dot" /> online
                  </div>
                </div>
                <div className="demo-wa-icons">
                  <span aria-hidden>📞</span>
                  <span aria-hidden>⋮</span>
                </div>
              </div>

              <div className="demo-wa-body">
                <div className="demo-wa-date-pill">hoje, {nowHHMM()}</div>

                {!played && !playing && visibleBubbles.length === 0 && (
                  <div className="demo-wa-empty">
                    <div className="demo-wa-empty-ic">💬</div>
                    <p>Clique em <strong>Disparar lembrete</strong> pra ver a conversa.</p>
                  </div>
                )}

                {visibleBubbles.map((b, i) => (
                  <div
                    key={i}
                    className={`demo-wa-bubble ${b.kind === 'in' ? 'demo-wa-in' : 'demo-wa-out'}`}
                  >
                    <span className="demo-wa-text">{b.text}</span>
                    <span className="demo-wa-time">
                      {timeLabel(i)}
                      {b.kind === 'out' && <span className="demo-wa-check">✓✓</span>}
                    </span>
                  </div>
                ))}

                {typing && (
                  <div className={`demo-wa-bubble ${typing === 'in' ? 'demo-wa-in' : 'demo-wa-out'} demo-wa-typing`}>
                    <span className="demo-wa-dots">
                      <span /><span /><span />
                    </span>
                  </div>
                )}
              </div>

              <div className="demo-wa-input">
                <span className="demo-wa-input-emoji" aria-hidden>😊</span>
                <span className="demo-wa-input-ph">Mensagem</span>
                <span className="demo-wa-input-mic" aria-hidden>🎤</span>
              </div>
            </div>
          </div>

          <div className={`demo-status-card ${played ? `tone-${statusLabel.tone}` : ''} ${statusAnimating ? 'pulse' : ''}`}>
            <div className="demo-status-row">
              <div className="demo-status-when">
                <div className="demo-status-day">{dateBR}</div>
                <div className="demo-status-time">{time || '--:--'}</div>
              </div>
              <div className="demo-status-info">
                <div className="demo-status-patient">{safeName}</div>
                <div className="demo-status-service">{service}</div>
              </div>
              <div className={`demo-status-badge ${played ? `badge-${statusLabel.tone}` : ''}`}>
                <span className="demo-status-pill-dot" />
                {played ? statusLabel.text : 'Aguardando'}
              </div>
            </div>
            <div className="demo-status-foot">
              {played
                ? scenario === 'confirm'
                  ? 'Agenda sincronizada com o Google Calendar.'
                  : scenario === 'reschedule'
                  ? `Reagendado para ${formatDateBR(reschedule.iso)} 15:00.`
                  : scenario === 'cancel'
                  ? 'Vaga liberada pra lista de espera.'
                  : `Recibo enviado. Saldo do pacote: 4/10 sessões.`
                : 'A IA atualiza o status assim que o paciente responde.'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── CTA ROW ─── */}
      <div className="demo-cta-row">
        <p className="demo-cta-lead">
          Comece grátis em menos de 5 minutos. Sem cartão, sem instalação.
        </p>
        <button type="button" className="demo-cta-btn" onClick={handleCTAClick}>
          Testar com a minha clínica &rarr;
        </button>
      </div>
    </section>
  )
}
