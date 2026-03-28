"use client"

import { CheckCircle } from "lucide-react"
import Link from "next/link"

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export function SuccessStep({
  result,
  slug,
}: {
  result: { professional: string; start_time: string; end_time: string }
  slug: string
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
      <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Agendamento realizado!</h2>
      <p className="text-sm text-slate-500 mb-6">
        Sua consulta foi agendada com sucesso. Aguarde a confirmação da clínica.
      </p>

      <div className="bg-slate-50 rounded-lg p-4 text-left text-sm space-y-1.5 mb-6">
        <p>
          <span className="font-medium text-slate-700">Profissional:</span>{" "}
          <span className="text-slate-600">{result.professional}</span>
        </p>
        <p>
          <span className="font-medium text-slate-700">Data:</span>{" "}
          <span className="text-slate-600">{formatDate(result.start_time)}</span>
        </p>
        <p>
          <span className="font-medium text-slate-700">Horário:</span>{" "}
          <span className="text-slate-600">
            {formatTime(result.start_time)} - {formatTime(result.end_time)}
          </span>
        </p>
      </div>

      <Link
        href={`/agendar/${slug}`}
        className="inline-block text-sm text-cyan-600 hover:underline"
      >
        Voltar para a página da clínica
      </Link>
    </div>
  )
}
