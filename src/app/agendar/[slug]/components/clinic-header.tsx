"use client"

import Link from "next/link"
import { CalendarDays } from "lucide-react"
import type { ClinicInfo, Specialty } from "../api"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function ClinicHeader({
  clinic,
  slug,
  specialties,
}: {
  clinic: ClinicInfo
  slug: string
  specialties: Specialty[]
}) {
  const brandColor = "#0891b2"
  const brandDk = "#0e7490"

  // Build subtitle: "Especialidade1 · Especialidade2 · Cidade, UF"
  const specNames = specialties.slice(0, 3).map((s) => s.name)
  const location = clinic.city && clinic.state ? `${clinic.city}, ${clinic.state}` : ""
  const subtitle = [...specNames, location].filter(Boolean).join(" · ")

  return (
    <div
      className="rounded-[10px] px-6 pt-7 pb-6 mb-6 text-white"
      style={{
        background: `linear-gradient(135deg, ${brandColor} 0%, ${brandDk} 100%)`,
      }}
    >
      {/* Logo / Initials */}
      <div className="w-[52px] h-[52px] rounded-full bg-white/20 flex items-center justify-center text-lg font-semibold mb-3 overflow-hidden">
        {clinic.logo_url ? (
          <img src={clinic.logo_url} alt={clinic.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          getInitials(clinic.name)
        )}
      </div>

      {/* Name */}
      <div className="text-[22px] font-semibold leading-tight">{clinic.name}</div>

      {/* Subtitle: specialties + location */}
      {subtitle && (
        <div className="text-[13px] opacity-80 mt-1">{subtitle}</div>
      )}

      {/* Stats row */}
      <div className="flex gap-5 mt-4 pt-4 border-t border-white/20">
        <div>
          <div className="text-xl font-semibold">4.8 ★</div>
          <div className="text-[11px] opacity-75 mt-0.5">Avaliação geral</div>
        </div>
        <div>
          <div className="text-xl font-semibold">{clinic.professional_count}</div>
          <div className="text-[11px] opacity-75 mt-0.5">Profissionais</div>
        </div>
        <div>
          <div className="text-xl font-semibold">{clinic.specialty_count}</div>
          <div className="text-[11px] opacity-75 mt-0.5">Especialidades</div>
        </div>
      </div>

      {/* CTA button */}
      <Link
        href={`/agendar/${slug}/booking`}
        className="inline-flex items-center justify-center gap-2 w-full mt-5 px-5 py-3 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors backdrop-blur-sm"
      >
        <CalendarDays className="h-4 w-4" />
        Agendar consulta
      </Link>
    </div>
  )
}
