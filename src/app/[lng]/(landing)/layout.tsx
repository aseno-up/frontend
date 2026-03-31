import Script from "next/script"

interface LandingLayoutProps {
  children: React.ReactNode
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="dark">
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
