import type { MetadataRoute } from 'next'

const BASE_URL = 'https://app.aseno.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/pt-BR',
          '/pt-BR/integracoes',
          '/pt-BR/sobre',
          '/pt-BR/contato',
          '/pt-BR/privacidade',
          '/pt-BR/termos',
          '/clinica/',
        ],
        disallow: [
          '/pt-BR/admin/',
          '/pt-BR/login',
          '/pt-BR/register',
          '/en/admin/',
          '/en/login',
          '/en/register',
          '/portal/',
          '/pagar/',
          '/api/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
