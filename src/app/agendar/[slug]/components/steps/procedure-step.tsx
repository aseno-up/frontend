"use client"

import type { Procedure } from "../../api"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function ProcedureStep({
  procedures,
  onSelect,
}: {
  procedures: Procedure[]
  onSelect: (proc: Procedure | null) => void
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Serviço</h2>
      <p className="text-sm text-slate-500 mb-5">Selecione o serviço desejado</p>

      <div className="space-y-2">
        {procedures.map((proc) => (
          <button
            key={proc.id}
            onClick={() => onSelect(proc)}
            className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-700">{proc.name}</div>
                {proc.duration_minutes > 0 && (
                  <div className="text-xs text-slate-400 mt-0.5">{proc.duration_minutes} min</div>
                )}
              </div>
              {proc.price > 0 && (
                <div className="text-sm font-semibold text-cyan-700">{formatCurrency(proc.price)}</div>
              )}
            </div>
          </button>
        ))}

        <button
          onClick={() => onSelect(null)}
          className="w-full text-center px-4 py-2.5 text-sm text-slate-500 hover:text-cyan-600 transition-colors cursor-pointer bg-transparent border-none"
        >
          Pular seleção de serviço
        </button>
      </div>
    </div>
  )
}
