'use client'

import { requestReopen } from '@/lib/cookie-consent'

export function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={() => requestReopen()}
      className="ft-cookie-link"
    >
      Configurações de cookies
    </button>
  )
}
