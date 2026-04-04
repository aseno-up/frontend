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

  const landingPages = [
    '/para-estetica',
    '/para-fisioterapia',
    '/para-massoterapia',
    '/para-nutricao',
    '/para-pilates-e-yoga',
    '/para-psicologia',
    '/kit-planilhas',
  ]

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${BASE_URL}/pt-BR${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1.0 : 0.7,
  }))

  const landingEntries: MetadataRoute.Sitemap = landingPages.map((path) => ({
    url: `${BASE_URL}/pt-BR${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticEntries, ...landingEntries]
}
