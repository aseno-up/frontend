import { Inter, Poppins } from "next/font/google"
import { languages } from "@/lib/i18n/settings"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }))
}

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ lng: string }>
}

export default async function LngLayout({ children, params }: LayoutProps) {
  const { lng } = await params

  return (
    <html lang={lng} className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
