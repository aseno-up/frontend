import type { MetadataRoute } from 'next'

const BASE_URL = 'https://aseno.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/integracoes',
          '/sobre',
          '/contato',
          '/privacidade',
          '/termos',
          '/para-clinicas',
          '/para-estetica',
          '/para-fisioterapia',
          '/para-massoterapia',
          '/para-nutricao',
          '/para-pilates-e-yoga',
          '/para-psicologia',
          '/kit-planilhas',
          '/clinica/',
        ],
        disallow: [
          '/admin/',
          '/login',
          '/register',
          '/pt-BR/',
          '/en/',
          '/portal/',
          '/pagar/',
          '/api/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
