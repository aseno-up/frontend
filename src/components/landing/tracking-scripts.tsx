'use client'

import { FacebookPixel } from '@/components/facebook-pixel'
import { GoogleAnalytics } from '@/components/google-analytics'
import { GoogleAdsTag } from '@/components/google-ads-tag'
import { GoogleTagManager } from '@/components/google-tag-manager'

interface TrackingScriptsProps {
  gtmContainerId: string
  gaMeasurementId: string
  googleAdsConversionId: string
}

// Tracking carrega desde o load da página. O banner de cookies é apenas
// informativo (botão "Entendi" só esconde o aviso).
export function TrackingScripts({
  gtmContainerId,
  gaMeasurementId,
  googleAdsConversionId,
}: TrackingScriptsProps) {
  return (
    <>
      <GoogleTagManager containerId={gtmContainerId} />
      <FacebookPixel />
      <GoogleAnalytics measurementId={gaMeasurementId} />
      <GoogleAdsTag conversionId={googleAdsConversionId} />
    </>
  )
}
