import { CookieConsentBanner } from "@/components/landing/cookie-consent-banner"
import { PromotionBanner } from "@/components/landing/promotion-banner"
import { TrackingScripts } from "@/components/landing/tracking-scripts"
import { getActivePromotion } from "@/lib/server/promotion"
import { WhatsAppFloat } from "./whatsapp-float"
import { StickyMobileCTA } from "./sticky-mobile-cta"
import { EngagementModal } from "./engagement-modal"
import "./landing.css"

interface LandingLayoutProps {
  children: React.ReactNode
  params: Promise<{ lng: string }>
}

export default async function LandingLayout({ children, params }: LandingLayoutProps) {
  const promotion = await getActivePromotion()
  const { lng } = await params

  return (
    <div className="dark">
      <TrackingScripts
        gtmContainerId="GTM-W9773P7N"
        gaMeasurementId="G-PQNQJQ3BVH"
        googleAdsConversionId="AW-758071096"
      />
      {promotion && <PromotionBanner promotion={promotion} />}
      {children}
      <WhatsAppFloat />
      <StickyMobileCTA lng={lng} />
      <EngagementModal lng={lng} />
      <CookieConsentBanner />
    </div>
  )
}
