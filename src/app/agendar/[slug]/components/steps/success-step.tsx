"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle, CreditCard } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api/client"

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

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

interface SuccessStepProps {
  result: {
    id: string
    clinic_id: string
    professional: string
    start_time: string
    end_time: string
    price: number
    payment_token?: string
  }
  slug: string
}

export function SuccessStep({ result, slug }: SuccessStepProps) {
  const [hasSubaccount, setHasSubaccount] = useState(false)
  const [checking, setChecking] = useState(true)

  const checkSubaccount = useCallback(async () => {
    try {
      const data = await api.checkMarketplaceSubaccount(result.clinic_id)
      setHasSubaccount(data.has_subaccount)
    } catch {
      setHasSubaccount(false)
    } finally {
      setChecking(false)
    }
  }, [result.clinic_id])

  useEffect(() => {
    if (result.price > 0 && result.payment_token) {
      checkSubaccount()
    } else {
      setChecking(false)
    }
  }, [result.price, result.payment_token, checkSubaccount])

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
      <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Agendamento realizado!</h2>
      <p className="text-sm text-slate-500 mb-6">
        Sua consulta foi agendada com sucesso. Aguarde a confirmacao da clinica.
      </p>

      <div className="bg-slate-50 rounded-lg p-4 text-left text-sm space-y-1.5 mb-6">
        <p><span className="font-medium text-slate-700">Profissional:</span> <span className="text-slate-600">{result.professional}</span></p>
        <p><span className="font-medium text-slate-700">Data:</span> <span className="text-slate-600">{formatDate(result.start_time)}</span></p>
        <p><span className="font-medium text-slate-700">Horario:</span> <span className="text-slate-600">{formatTime(result.start_time)} - {formatTime(result.end_time)}</span></p>
        {result.price > 0 && (
          <p><span className="font-medium text-slate-700">Valor:</span> <span className="text-slate-600">{formatCurrency(result.price)}</span></p>
        )}
      </div>

      {!checking && hasSubaccount && result.payment_token && result.price > 0 && (
        <div className="mb-6">
          <Link
            href={`/pagar/${result.payment_token}`}
            className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer transition-colors flex items-center justify-center gap-2 no-underline"
          >
            <CreditCard className="h-4 w-4" />
            Pagar agora — {formatCurrency(result.price)}
          </Link>
          <p className="text-xs text-slate-400 mt-2">Pagamento opcional. Voce tambem pode pagar no dia da consulta.</p>
        </div>
      )}

      <Link
        href={`/agendar/${slug}`}
        className="inline-block text-sm text-cyan-600 hover:underline"
      >
        Voltar para a pagina da clinica
      </Link>
    </div>
  )
}
