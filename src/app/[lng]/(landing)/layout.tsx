import { FacebookPixel } from "@/components/facebook-pixel"
import { GoogleAnalytics } from "@/components/google-analytics"
import { GoogleAdsTag } from "@/components/google-ads-tag"
import { GoogleTagManager } from "@/components/google-tag-manager"
import { LaunchCountdownBar } from "@/components/landing/launch-countdown-bar"
import { WhatsAppFloat } from "./whatsapp-float"
import "./landing.css"

interface LandingLayoutProps {
  children: React.ReactNode
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="dark">
      <GoogleTagManager containerId="GTM-W9773P7N" />
      <FacebookPixel />
      <GoogleAnalytics measurementId="G-PQNQJQ3BVH" />
      <GoogleAdsTag conversionId="AW-758071096" />
      <LaunchCountdownBar />
      {children}
      <WhatsAppFloat />
    </div>
  )
}
