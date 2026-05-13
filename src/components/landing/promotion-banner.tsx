'use client'

import { useEffect, useState } from 'react'
import { Clock, Info, X } from 'lucide-react'
import type { ActivePromotion } from '@/lib/server/promotion'

interface PromotionBannerProps {
  promotion: ActivePromotion
}

function breakdown(remainingMs: number) {
  const total = Math.max(0, Math.floor(remainingMs / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

const pad2 = (n: number) => n.toString().padStart(2, '0')

function formatExpireDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function PromotionBanner({ promotion }: PromotionBannerProps) {
  const expiresAt = new Date(promotion.expires_at).getTime()
  const [remaining, setRemaining] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    if (!promotion.banner_show_timer) return
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [expiresAt, promotion.banner_show_timer])

  if (dismissed) return null
  // Se a promoção expirou enquanto a página estava aberta, esconde o banner
  // em vez de mostrar 00:00:00:00 com contagem negativa.
  if (remaining !== null && remaining <= 0) return null

  const { days, hours, minutes, seconds } = breakdown(remaining ?? expiresAt - Date.now())

  return (
    <>
      <div className="launch-bar" role="region" aria-label="Promoção por tempo limitado">
        <div className="launch-bar-inner">
          <span className="launch-bar-label">
            <Clock className="launch-bar-icon" size={15} strokeWidth={2.4} aria-hidden="true" />
            <span className="launch-bar-label-text">
              {promotion.banner_label} · −{promotion.discount_percent}%
            </span>
            {promotion.description && (
              <button
                type="button"
                className="launch-bar-info"
                onClick={() => setInfoOpen(true)}
                aria-label="Como funciona a promoção"
              >
                <Info size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
            )}
          </span>

          {promotion.banner_show_timer ? (
            <div className="launch-bar-timer" aria-live="off">
              <div className="launch-bar-unit">
                <div className="launch-bar-num" suppressHydrationWarning>{pad2(days)}</div>
                <div className="launch-bar-tag">DIAS</div>
              </div>
              <span className="launch-bar-sep">:</span>
              <div className="launch-bar-unit">
                <div className="launch-bar-num" suppressHydrationWarning>{pad2(hours)}</div>
                <div className="launch-bar-tag">HORAS</div>
              </div>
              <span className="launch-bar-sep">:</span>
              <div className="launch-bar-unit">
                <div className="launch-bar-num" suppressHydrationWarning>{pad2(minutes)}</div>
                <div className="launch-bar-tag">MIN</div>
              </div>
              <span className="launch-bar-sep">:</span>
              <div className="launch-bar-unit">
                <div className="launch-bar-num" suppressHydrationWarning>{pad2(seconds)}</div>
                <div className="launch-bar-tag">SEG</div>
              </div>
            </div>
          ) : (
            <span className="launch-bar-expires">
              Expira em {formatExpireDate(promotion.expires_at)}
            </span>
          )}

          <a className="launch-bar-cta" href="#precos">
            Garantir agora <span aria-hidden="true">→</span>
          </a>
        </div>

        <button
          type="button"
          className="launch-bar-close"
          aria-label="Fechar barra de oferta"
          onClick={() => setDismissed(true)}
        >
          <X size={16} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>

      {infoOpen && (
        <div
          className="promo-info-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-info-title"
          onClick={() => setInfoOpen(false)}
        >
          <div className="promo-info-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="promo-info-close"
              aria-label="Fechar"
              onClick={() => setInfoOpen(false)}
            >
              <X size={18} strokeWidth={2.4} aria-hidden="true" />
            </button>
            <h2 id="promo-info-title" className="promo-info-title">
              {promotion.banner_label}
            </h2>
            <p className="promo-info-discount">
              {promotion.discount_percent}% de desconto
            </p>
            <p className="promo-info-desc">{promotion.description}</p>
            <p className="promo-info-expires">
              Válida até {formatExpireDate(promotion.expires_at)}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
