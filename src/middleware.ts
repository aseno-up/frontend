import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { languages, fallbackLng, cookieName } from '@/lib/i18n/settings'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip for public files, api routes, and public booking pages
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/agendar') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if the pathname is missing a locale
  const pathnameIsMissingLocale = languages.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // 1. If explicit default locale is present (e.g., /pt-BR/agenda), redirect to clean URL (/agenda)
  if (pathname.startsWith(`/${fallbackLng}/`) || pathname === `/${fallbackLng}`) {
    // Remove the default locale from the path, preserving query params
    const newPath = pathname.replace(`/${fallbackLng}`, '')
    const redirectUrl = new URL(newPath || '/', request.url)
    redirectUrl.search = request.nextUrl.search
    return NextResponse.redirect(redirectUrl)
  }

  // 2. If missing locale (e.g., /agenda)
  if (pathnameIsMissingLocale) {
    // Check cookie preference
    const cookieLocale = request.cookies.get(cookieName)?.value
    
    // If the user has a cookie for a DIFFERENT language (e.g., 'en'), redirect to that language
    if (cookieLocale && cookieLocale !== fallbackLng && languages.includes(cookieLocale)) {
        return NextResponse.redirect(new URL(`/${cookieLocale}${pathname}`, request.url))
    }

    // If cookie is missing OR is the default language, REWRITE to the default language folder
    // This allows the URL to remain clean (e.g. /agenda) while Next.js handles it as /pt-BR/agenda internally
    return NextResponse.rewrite(
      new URL(`/${fallbackLng}${pathname}`, request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}