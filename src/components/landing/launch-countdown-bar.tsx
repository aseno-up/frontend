'use client'

import { useEffect, useState } from 'react'
import { Clock, X } from 'lucide-react'

const STORAGE_KEY = 'aseno_launch_countdown_end'
const DEFAULT_DURATION_MS = (24 + 12) * 60 * 60 * 1000

function readOrCreateEnd(durationMs: number): number {
  const now = Date.now()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = Number.parseInt(raw, 10)
      // Honor only stored values still in the future and within the duration window.
      // When the timer reaches 0, the stored value is in the past → we regenerate
      // a fresh `now + durationMs`, so the countdown restarts at 1d 12h.
      if (Number.isFinite(parsed) && parsed > now && parsed - now <= durationMs) {
        return parsed
      }
    }
  } catch {}
  const end = now + durationMs
  try {
    window.localStorage.setItem(STORAGE_KEY, String(end))
  } catch {}
  return end
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

interface LaunchCountdownBarProps {
  durationMs?: number
}

export function LaunchCountdownBar({ durationMs = DEFAULT_DURATION_MS }: LaunchCountdownBarProps) {
  const [remaining, setRemaining] = useState<number | null>(null)
  // Dismiss lives only in component state (no localStorage) so a page refresh
  // brings the bar back.
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (dismissed) return
    let end = readOrCreateEnd(durationMs)
    const tick = () => {
      const now = Date.now()
      let ms = end - now
      if (ms <= 0) {
        // Evergreen: when the countdown hits zero, regenerate a fresh window
        // and persist it, so the bar restarts at the full duration (1d 12h).
        end = now + durationMs
        try {
          window.localStorage.setItem(STORAGE_KEY, String(end))
        } catch {}
        ms = durationMs
      }
      setRemaining(ms)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [durationMs, dismissed])

  if (dismissed) return null

  const ms = remaining ?? durationMs
  const { days, hours, minutes, seconds } = breakdown(ms)

  return (
    <div className="launch-bar" role="region" aria-label="Promoção por tempo limitado">
      <div className="launch-bar-inner">
        <span className="launch-bar-label">
          <Clock className="launch-bar-icon" size={15} strokeWidth={2.4} aria-hidden="true" />
          <span className="launch-bar-label-text">Oferta encerra em:</span>
        </span>

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

        <a className="launch-bar-cta" href="/#precos">
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
  )
}
