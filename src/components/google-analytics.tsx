'use client'

import Script from 'next/script'
import { useEffect } from 'react'

type GtagFn = (...args: unknown[]) => void

function getGtag(): GtagFn | undefined {
  return (window as unknown as { gtag?: GtagFn }).gtag
}

interface GoogleAnalyticsProps {
  measurementId: string
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return

    const gtag = getGtag()
    if (gtag) {
      gtag('consent', 'update', { analytics_storage: 'granted' })
      gtag('event', 'page_view', {
        page_path: window.location.pathname + window.location.search,
        page_location: window.location.href,
      })
    }

    return () => {
      getGtag()?.('consent', 'update', { analytics_storage: 'denied' })
    }
  }, [measurementId])

  if (process.env.NODE_ENV !== 'production') return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', { analytics_storage: 'granted' });
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  )
}
