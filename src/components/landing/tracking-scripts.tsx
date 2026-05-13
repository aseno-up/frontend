'use client'

import { useEffect, useState } from 'react'
import { FacebookPixel } from '@/components/facebook-pixel'
import { GoogleAnalytics } from '@/components/google-analytics'
import { GoogleAdsTag } from '@/components/google-ads-tag'
import { GoogleTagManager } from '@/components/google-tag-manager'
import { getConsent, onConsentChange } from '@/lib/cookie-consent'

interface TrackingScriptsProps {
  gtmContainerId: string
  gaMeasurementId: string
  googleAdsConversionId: string
}

export function TrackingScripts({
  gtmContainerId,
  gaMeasurementId,
  googleAdsConversionId,
}: TrackingScriptsProps) {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    setAllowed(getConsent() === 'all')
    const off = onConsentChange((value) => setAllowed(value === 'all'))
    return off
  }, [])

  if (!allowed) return null

  return (
    <>
      <GoogleTagManager containerId={gtmContainerId} />
      <FacebookPixel />
      <GoogleAnalytics measurementId={gaMeasurementId} />
      <GoogleAdsTag conversionId={googleAdsConversionId} />
    </>
  )
}
