/**
 * Consentimento de cookies — conformidade com LGPD (art. 7º, I + art. 8º)
 * e Guia de Cookies da ANPD (out/2023).
 *
 * Categorias:
 *  - 'essential': apenas cookies indispensáveis (sessão, auth, i18n)
 *  - 'all': essenciais + analytics (GA) + marketing (Meta Pixel, Google Ads, GTM)
 *
 * Decisão fica em um cookie próprio (`aseno_cookie_consent`) com validade de 12 meses.
 * O cookie é first-party, não-essencial-funcional do ponto de vista do guia da ANPD
 * (registra a escolha do usuário), e por isso pode ser definido sem consentimento prévio.
 */

export type CookieConsent = 'essential' | 'all'

export const COOKIE_NAME = 'aseno_cookie_consent'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365 // 12 meses
const CHANGE_EVENT = 'aseno:cookie-consent-change'

export function getConsent(): CookieConsent | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]+)'),
  )
  if (!match) return null
  const value = decodeURIComponent(match[1])
  return value === 'all' || value === 'essential' ? value : null
}

export function setConsent(value: CookieConsent): void {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie =
    COOKIE_NAME +
    '=' +
    encodeURIComponent(value) +
    '; Max-Age=' +
    MAX_AGE_SECONDS +
    '; Path=/; SameSite=Lax' +
    secure
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: value }))
}

export function clearConsent(): void {
  if (typeof document === 'undefined') return
  document.cookie = COOKIE_NAME + '=; Max-Age=0; Path=/; SameSite=Lax'
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: null }))
}

export function onConsentChange(
  handler: (value: CookieConsent | null) => void,
): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<CookieConsent | null>).detail
    handler(detail ?? null)
  }
  window.addEventListener(CHANGE_EVENT, listener)
  return () => window.removeEventListener(CHANGE_EVENT, listener)
}

// Disparado pelo link "Configurações de cookies" no footer.
// Não muda o consentimento — apenas pede ao banner pra reaparecer.
const REOPEN_EVENT = 'aseno:cookie-consent-reopen'

export function requestReopen(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(REOPEN_EVENT))
}

export function onReopenRequest(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(REOPEN_EVENT, handler)
  return () => window.removeEventListener(REOPEN_EVENT, handler)
}
