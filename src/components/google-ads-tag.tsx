'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const DEV_HOSTS = ['localhost', '127.0.0.1', '']

interface GoogleAdsTagProps {
  conversionId: string
}

export function GoogleAdsTag({ conversionId }: GoogleAdsTagProps) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (DEV_HOSTS.includes(window.location.hostname)) return
    setEnabled(true)
  }, [])

  if (!enabled) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${conversionId}`}
        strategy="afterInteractive"
      />
      <Script id={`google-ads-${conversionId}`} strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${conversionId}');
        `}
      </Script>
    </>
  )
}
