// Server-only helpers for fetching the active promotion.
// Cached by Next.js with the 'active-promotion' tag — invalidated after admin CRUD
// via POST /api/revalidate-promotion.

export interface ActivePromotion {
  id: string
  name: string
  description: string
  discount_percent: number
  starts_at: string
  expires_at: string
  is_active: boolean
  plans_affected: string[]
  banner_label: string
  banner_show_timer: boolean
  created_at: string
  updated_at: string
}

interface ActivePromotionResponse {
  data: ActivePromotion | null
}

export async function getActivePromotion(): Promise<ActivePromotion | null> {
  try {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(
      /\/api\/v1\/?$/,
      '',
    )
    const response = await fetch(`${baseUrl}/api/v1/public/promotions/active`, {
      next: { revalidate: 60, tags: ['active-promotion'] },
    })
    if (!response.ok) return null
    const payload = (await response.json()) as ActivePromotionResponse
    const promo = payload.data
    if (!promo) return null
    // Defesa em camadas: o backend já filtra por janela e is_active, mas se algo
    // estranho passar (ex: cache servindo um snapshot velho enquanto a promoção
    // expirou), o frontend nunca exibe banner fora da janela.
    const now = Date.now()
    const starts = new Date(promo.starts_at).getTime()
    const expires = new Date(promo.expires_at).getTime()
    if (!promo.is_active) return null
    if (now < starts || now >= expires) return null
    return promo
  } catch {
    // Erro de rede ou backend fora do ar: NÃO mostrar banner.
    // O usuário falou isso explicitamente: "nao pode ter problema ao carregar a pagina".
    return null
  }
}

export function discountedMonthlyPrice(
  originalPriceCents: number,
  discountPercent: number,
): number {
  const discounted = Math.round(originalPriceCents * (100 - discountPercent)) / 100
  return Math.max(0, discounted)
}
