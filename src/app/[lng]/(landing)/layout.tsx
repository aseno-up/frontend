import { FacebookPixel } from "@/components/facebook-pixel"
import { GoogleAnalytics } from "@/components/google-analytics"
import { WhatsAppFloat } from "./whatsapp-float"

interface LandingLayoutProps {
  children: React.ReactNode
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="dark">
      <FacebookPixel />
      <GoogleAnalytics measurementId="G-PQNQJQ3BVH" />
      {children}
      <WhatsAppFloat />
    </div>
  )
}
