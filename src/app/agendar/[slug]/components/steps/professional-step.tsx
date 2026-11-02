"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import type { Professional } from "../../api"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function ProfessionalStep({
  professionals,
  onSelect,
}: {
  professionals: Professional[]
  onSelect: (prof: Professional) => void
}) {
  const [search, setSearch] = useState("")

  const filtered = professionals.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.specialty_names?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  )

  const available = filtered.filter((p) => p.has_available_schedule)
  const unavailable = filtered.filter((p) => !p.has_available_schedule)

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Profissional</h2>
      <p className="text-sm text-slate-500 mb-4">Selecione o profissional para o atendimento</p>

      {professionals.length > 5 && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar profissional..."
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-cyan-600 transition-colors"
          />
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {available.length === 0 && unavailable.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Nenhum profissional encontrado</p>
        )}

        {available.map((prof) => (
          <button
            key={prof.id}
            onClick={() => onSelect(prof)}
            className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-sky-50 border border-slate-200 flex items-center justify-center text-sm font-semibold text-sky-800 shrink-0 overflow-hidden">
              {prof.avatar_url ? (
                <img src={prof.avatar_url} alt={prof.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(prof.name)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-700 truncate">{prof.name}</div>
              <div className="text-xs text-slate-400 truncate">
                {prof.specialty_names?.join(" · ") || ""}
              </div>
            </div>
            <div className="text-xs text-cyan-600 font-medium shrink-0">Agendar</div>
          </button>
        ))}

        {unavailable.map((prof) => (
          <div
            key={prof.id}
            className="w-full text-left px-4 py-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center gap-3 opacity-60"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-400 shrink-0">
              {getInitials(prof.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-500 truncate">{prof.name}</div>
              <div className="text-xs text-slate-400 truncate">
                {prof.specialty_names?.join(" · ") || ""}
              </div>
            </div>
            <div className="text-xs text-slate-400 shrink-0">Sem agenda</div>
          </div>
        ))}
      </div>
    </div>
  )
}
