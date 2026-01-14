import { languages } from "@/lib/i18n/settings"
import { Providers } from "@/components/providers"

export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }))
}

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ lng: string }>
}

export default async function LngLayout({ children, params }: LayoutProps) {
  await params // consume the params

  return <Providers>{children}</Providers>
}
