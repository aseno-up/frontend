import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901/api/v1'

interface ClinicInfo {
  name: string
  slug: string
  about_us: string
  city: string
  state: string
}

// Server-side fetch for dynamic metadata generation
async function getClinicInfo(slug: string): Promise<ClinicInfo | null> {
  try {
    const res = await fetch(`${API_URL}/book/${slug}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

interface PageProps {
  params: Promise<{ slug: string }>
}

// Generate dynamic metadata for each clinic page (SEO-friendly)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const clinic = await getClinicInfo(slug)

  if (!clinic) {
    return {
      title: 'Clínica não encontrada | Aseno',
      description: 'A clínica solicitada não foi encontrada.',
    }
  }

  const location = [clinic.city, clinic.state].filter(Boolean).join(', ')

  return {
    title: `${clinic.name} — Agendar Consulta Online | Aseno`,
    description: clinic.about_us
      ? `${clinic.about_us.slice(0, 150)}${clinic.about_us.length > 150 ? '...' : ''}`
      : `Agende sua consulta online na ${clinic.name}${location ? ` em ${location}` : ''}. Horários disponíveis 24/7.`,
    openGraph: {
      title: `${clinic.name} — Agendar Consulta Online`,
      description: clinic.about_us || `Agende sua consulta na ${clinic.name}.`,
      type: 'website',
    },
  }
}

// /clinica/[slug] redirects to /agendar/[slug] which has the full booking UI
// This route exists as a clean, SEO-friendly URL for clinic public pages
export default async function ClinicaPage({ params }: PageProps) {
  const { slug } = await params
  redirect(`/agendar/${slug}`)
}
