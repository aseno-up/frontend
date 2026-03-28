"use client"

import Link from "next/link"
import type { Professional } from "../api"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function ProfessionalCard({
  professional,
  slug,
}: {
  professional: Professional
  slug: string
}) {
  const hasSchedule = professional.has_available_schedule

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 pt-5 text-center">
      {/* Avatar */}
      <div className="w-[50px] h-[50px] rounded-full bg-sky-50 border-[1.5px] border-slate-200 flex items-center justify-center mx-auto mb-2.5 text-base font-semibold text-sky-800 overflow-hidden">
        {professional.avatar_url ? (
          <img
            src={professional.avatar_url}
            alt={professional.name}
            className="w-full h-full object-cover"
          />
        ) : (
          getInitials(professional.name)
        )}
      </div>

      <div className="text-[13px] font-semibold text-slate-900">{professional.name}</div>
      <div className="text-xs text-slate-500 mt-0.5 mb-3">
        {professional.specialty_names?.join(" · ") || ""}
      </div>

      {hasSchedule ? (
        <Link
          href={`/agendar/${slug}/booking?professional=${professional.id}`}
          className="block w-full bg-cyan-600 hover:bg-cyan-700 text-white border-none rounded-md py-2 text-[13px] font-medium transition-colors text-center"
        >
          Agendar
        </Link>
      ) : (
        <div className="w-full bg-slate-50 text-slate-400 border border-slate-200 rounded-md py-2 text-[13px] font-medium cursor-default text-center">
          Sem agenda aberta
        </div>
      )}
    </div>
  )
}
