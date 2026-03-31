import type { MetadataRoute } from 'next'

const BASE_URL = 'https://app.aseno.com.br'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/integracoes',
    '/sobre',
    '/contato',
    '/privacidade',
    '/termos',
  ]

  return staticPages.map((path) => ({
    url: `${BASE_URL}/pt-BR${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1.0 : 0.7,
  }))
}
