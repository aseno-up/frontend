'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const DEV_HOSTS = ['localhost', '127.0.0.1', '']

type GtagFn = (...args: unknown[]) => void

function getGtag(): GtagFn | undefined {
  return (window as unknown as { gtag?: GtagFn }).gtag
}

interface GoogleAnalyticsProps {
  measurementId: string
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (DEV_HOSTS.includes(window.location.hostname)) return
    setEnabled(true)

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

  if (!enabled) return null

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
