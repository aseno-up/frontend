"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import type { Specialty } from "../../api"

export function SpecialtyStep({
  specialties,
  onSelect,
}: {
  specialties: Specialty[]
  onSelect: (spec: Specialty) => void
}) {
  const [search, setSearch] = useState("")

  const filtered = specialties.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  if (specialties.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Especialização</h2>
        <p className="text-sm text-slate-500">Nenhuma especialização cadastrada para esta clínica.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Especialização</h2>
      <p className="text-sm text-slate-500 mb-4">Selecione a especialização desejada</p>

      {specialties.length > 5 && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar especialização..."
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-cyan-600 transition-colors"
          />
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Nenhuma especialização encontrada</p>
        ) : (
          filtered.map((spec) => (
            <button
              key={spec.id}
              onClick={() => onSelect(spec)}
              className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="text-sm font-medium">{spec.name}</div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
