"use client"

export function FirstVisitStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Primeira consulta</h2>
      <p className="text-sm text-slate-500 mb-6">É a sua primeira consulta com este especialista?</p>

      <div className="space-y-3">
        <button
          onClick={onContinue}
          className="w-full text-left px-4 py-3.5 rounded-lg border border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="text-sm font-medium text-slate-700">Sim</div>
          <div className="text-xs text-slate-400 mt-0.5">É minha primeira vez com este profissional</div>
        </button>

        <button
          onClick={onContinue}
          className="w-full text-left px-4 py-3.5 rounded-lg border border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="text-sm font-medium text-slate-700">Não</div>
          <div className="text-xs text-slate-400 mt-0.5">Já fui atendido(a) por este profissional antes</div>
        </button>
      </div>
    </div>
  )
}
