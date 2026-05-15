'use client'

import { FacebookPixel } from '@/components/facebook-pixel'
import { GoogleAnalytics } from '@/components/google-analytics'
import { GoogleAdsTag } from '@/components/google-ads-tag'
import { GoogleTagManager } from '@/components/google-tag-manager'
import { MicrosoftClarity } from '@/components/microsoft-clarity'

interface TrackingScriptsProps {
  gtmContainerId: string
  gaMeasurementId: string
  googleAdsConversionId: string
  clarityProjectId?: string
}

// Tracking carrega desde o load da página. O banner de cookies é apenas
// informativo (botão "Entendi" só esconde o aviso).
export function TrackingScripts({
  gtmContainerId,
  gaMeasurementId,
  googleAdsConversionId,
  clarityProjectId,
}: TrackingScriptsProps) {
  return (
    <>
      <GoogleTagManager containerId={gtmContainerId} />
      <FacebookPixel />
      <GoogleAnalytics measurementId={gaMeasurementId} />
      <GoogleAdsTag conversionId={googleAdsConversionId} />
      <MicrosoftClarity projectId={clarityProjectId ?? process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? ''} />
    </>
  )
}
