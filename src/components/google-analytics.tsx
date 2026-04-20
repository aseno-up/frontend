'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const DEV_HOSTS = ['localhost', '127.0.0.1', '']

interface GoogleAnalyticsProps {
  measurementId: string
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(!DEV_HOSTS.includes(window.location.hostname))
  }, [])

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
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  )
}
