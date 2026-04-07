import Script from "next/script"
import { FacebookPixel } from "@/components/facebook-pixel"

interface LandingLayoutProps {
  children: React.ReactNode
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="dark">
      <FacebookPixel />
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-PQNQJQ3BVH"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-PQNQJQ3BVH');
        `}
      </Script>
      {children}
    </div>
  )
}
