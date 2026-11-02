"use client"

import { useState } from "react"

function StarRating({
  value,
  onChange,
  size = "large",
}: {
  value: number
  onChange: (v: number) => void
  size?: "large" | "small"
}) {
  const cls = size === "large" ? "text-[32px] px-0.5" : "text-xl px-0.5"
  return (
    <div className="flex justify-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`${cls} leading-none transition-colors cursor-pointer border-none bg-transparent ${
            n <= value ? "text-amber-500" : "text-slate-300"
          } hover:scale-110`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

const starLabels = ["", "Muito ruim", "Ruim", "Regular", "Bom", "Excelente"]

export function SurveyTab({ clinicName }: { clinicName: string }) {
  const [mainRating, setMainRating] = useState(0)
  const [aspects, setAspects] = useState({ pontualidade: 0, qualidade: 0, limpeza: 0, resultado: 0 })
  const [nps, setNps] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)

  function getInitials(name: string): string {
    return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
  }

  if (submitted) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-3.5 text-2xl text-green-800">
            ✓
          </div>
          <div className="text-lg font-semibold text-slate-900 mb-1.5">Obrigado pelo seu feedback!</div>
          <div className="text-sm text-slate-500">
            Sua avaliação foi registrada com sucesso e já aparecerá na página da clínica.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-7">
      {/* Header */}
      <div className="text-center pb-6 mb-6 border-b border-slate-200">
        <div className="w-11 h-11 rounded-full bg-cyan-600 flex items-center justify-center mx-auto mb-2.5 text-base font-semibold text-white">
          {getInitials(clinicName)}
        </div>
        <div className="text-xs text-slate-500">{clinicName}</div>
        <div className="text-xl font-semibold text-slate-900 mt-1.5 mb-1">Como foi sua consulta?</div>
        <div className="text-[13px] text-slate-500">Sua avaliação leva menos de 1 minuto e nos ajuda muito.</div>
      </div>

      {/* Main rating */}
      <div className="mb-6">
        <div className="text-sm font-medium text-slate-900 mb-2.5">Como você avalia o atendimento geral?</div>
        <StarRating value={mainRating} onChange={setMainRating} />
        <div className="text-center text-[13px] text-slate-500 font-medium mt-1 min-h-[20px]">
          {starLabels[mainRating]}
        </div>
      </div>

      {/* Aspects */}
      <div className="mb-6">
        <div className="text-sm font-medium text-slate-900 mb-2.5">Avalie cada aspecto:</div>
        <div className="grid grid-cols-2 gap-3">
          {(["pontualidade", "qualidade", "limpeza", "resultado"] as const).map((key) => (
            <div key={key}>
              <span className="text-xs text-slate-500 block mb-1.5 capitalize">
                {key === "qualidade" ? "Qualidade do atendimento" : key === "limpeza" ? "Limpeza e estrutura" : key === "resultado" ? "Resultado obtido" : key}
              </span>
              <StarRating
                value={aspects[key]}
                onChange={(v) => setAspects((prev) => ({ ...prev, [key]: v }))}
                size="small"
              />
            </div>
          ))}
        </div>
      </div>

      {/* NPS */}
      <div className="mb-6">
        <div className="text-sm font-medium text-slate-900 mb-2.5">
          De 0 a 10, qual a probabilidade de você indicar a clínica?
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setNps(i)}
              className={`min-w-[38px] h-[38px] rounded-md border text-[13px] font-medium cursor-pointer transition-colors ${
                nps === i
                  ? "bg-cyan-600 text-white border-cyan-600"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:border-cyan-600 hover:text-cyan-600"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-1.5 text-[11px] text-slate-500">
          <span>Baixa probabilidade</span>
          <span>Alta probabilidade</span>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-6">
        <div className="text-sm font-medium text-slate-900 mb-2.5">O que podemos melhorar? (opcional)</div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Descreva sua experiência ou deixe uma sugestão..."
          className="w-full min-h-[80px] resize-y border border-slate-200 rounded-md px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:border-cyan-600 transition-colors"
        />
      </div>

      <button
        type="button"
        onClick={() => setSubmitted(true)}
        className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white border-none rounded-md text-[15px] font-semibold cursor-pointer transition-colors"
      >
        Enviar avaliação
      </button>
    </div>
  )
}
