"use client"

import type { ClinicInfo, Professional, Specialty } from "../api"
import { ProfessionalCard } from "./professional-card"

export function ProfileTab({
  clinic,
  professionals,
  specialties,
  slug,
}: {
  clinic: ClinicInfo
  professionals: Professional[]
  specialties: Specialty[]
  slug: string
}) {
  return (
    <>
      {/* Sobre nos */}
      {clinic.about_us && (
        <div className="mb-7">
          <div className="text-[15px] font-semibold text-slate-900 mb-3">Sobre nós</div>
          <p className="text-sm text-slate-500 leading-7">{clinic.about_us}</p>
        </div>
      )}

      {/* Especializacoes */}
      {specialties.length > 0 && (
        <div className="mb-7">
          <div className="text-[15px] font-semibold text-slate-900 mb-3">Nossas especializações</div>
          <div className="flex flex-wrap gap-2">
            {specialties.map((spec) => (
              <span
                key={spec.id}
                className="bg-sky-50 text-sky-800 text-xs font-medium px-3 py-1.5 rounded-full"
              >
                {spec.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Profissionais */}
      <div className="mb-7">
        <div className="text-[15px] font-semibold text-slate-900 mb-3">Nossos profissionais</div>
        {professionals.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(175px,1fr))] gap-3">
            {professionals.map((prof) => (
              <ProfessionalCard key={prof.id} professional={prof} slug={slug} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Nenhum profissional com agenda disponível no momento.</p>
        )}
      </div>
    </>
  )
}
