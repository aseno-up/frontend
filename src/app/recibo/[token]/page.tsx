"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Download, Loader2, MapPin, Phone, Share2 } from "lucide-react"

import { api } from "@/lib/api/client"
import type { PublicReceiptResponse } from "@/types/api"
import { showToast } from "@/lib/toast"

function formatCurrency(value: number): string {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  const d = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const t = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  return `${d} às ${t}`
}

function formatDateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR")
}

interface ReceiptCopyProps {
  data: PublicReceiptResponse
  viaLabel?: "Via do paciente" | "Via da clínica"
  showSignatures: boolean
  compact: boolean
}

function ReceiptCopy({ data, viaLabel, showSignatures, compact }: ReceiptCopyProps) {
  return (
    <div
      className={`bg-white print:shadow-none print:rounded-none ${
        compact
          ? "rounded-lg shadow-sm print:border print:border-slate-300"
          : "rounded-xl shadow-sm"
      }`}
    >
      {viaLabel && (
        <div className="flex items-center justify-between px-6 py-2 text-[10px] uppercase tracking-widest text-slate-500 border-b bg-slate-50 print:bg-white">
          <span className="font-semibold">{viaLabel}</span>
          <span className="text-slate-400">{data.receipt_number}</span>
        </div>
      )}
      <header className={`flex items-start justify-between border-b ${compact ? "p-4" : "p-6"}`}>
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">Recibo</div>
          <div className={`mt-1 font-bold text-slate-900 ${compact ? "text-base" : "text-lg"}`}>{data.receipt_number}</div>
          <div className="text-xs text-slate-400 mt-1">
            Emitido em {formatDateTime(data.generated_at)}
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold text-slate-900 ${compact ? "text-base" : "text-lg"}`}>{data.clinic.name}</div>
          {data.clinic.document && (
            <div className="text-xs text-slate-500 mt-0.5">{data.clinic.document}</div>
          )}
          {data.clinic.address && (
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 justify-end">
              <MapPin className="h-3 w-3" /> {data.clinic.address}
            </div>
          )}
          {data.clinic.phone && (
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 justify-end">
              <Phone className="h-3 w-3" /> {data.clinic.phone}
            </div>
          )}
        </div>
      </header>

      <section className={`grid grid-cols-1 sm:grid-cols-2 gap-4 border-b ${compact ? "p-4" : "p-6"}`}>
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400">Paciente</div>
          <div className="mt-1 text-sm font-medium text-slate-800">{data.patient_name}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400">Data do atendimento</div>
          <div className="mt-1 text-sm font-medium text-slate-800">{formatDateTime(data.appointment_date)}</div>
        </div>
        {data.professional_name && (
          <div className="sm:col-span-2">
            <div className="text-xs uppercase tracking-wider text-slate-400">Profissional</div>
            <div className="mt-1 text-sm font-medium text-slate-800">{data.professional_name}</div>
          </div>
        )}
      </section>

      <section className={`border-b ${compact ? "p-4" : "p-6"}`}>
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">Procedimentos</div>
        {data.procedures.length === 0 ? (
          <p className="text-sm text-slate-500">Sem procedimentos registrados para este atendimento.</p>
        ) : (
          <ul className="divide-y">
            {data.procedures.map((p, i) => (
              <li key={i} className="flex justify-between items-center py-2 text-sm">
                <span className="text-slate-700">{p.name}</span>
                <span className="font-medium text-slate-800">{formatCurrency(p.price)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 space-y-1 text-sm">
          {data.discount > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Desconto</span>
              <span>- {formatCurrency(data.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-slate-900 pt-1 border-t">
            <span>Total</span>
            <span>{formatCurrency(data.total)}</span>
          </div>
        </div>
      </section>

      <section className={`${compact ? "p-4" : "p-6"} ${showSignatures ? "border-b" : ""}`}>
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">Pagamentos registrados</div>
        {data.payments.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum pagamento registrado.</p>
        ) : (
          <ul className="divide-y">
            {data.payments.map((p, i) => (
              <li key={i} className="flex justify-between items-center py-2 text-sm">
                <div>
                  <div className="text-slate-700">{p.method || "Pagamento"}</div>
                  <div className="text-xs text-slate-400">{formatDateOnly(p.paid_at)}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-800">{formatCurrency(p.amount)}</div>
                  {p.discount > 0 && (
                    <div className="text-xs text-slate-400">desc. {formatCurrency(p.discount)}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Total pago</span>
            <span className="font-medium">{formatCurrency(data.total_paid)}</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-900">
            <span>Saldo a pagar</span>
            <span>{formatCurrency(data.balance_due)}</span>
          </div>
        </div>
      </section>

      {showSignatures && (
        <section className={`grid grid-cols-2 gap-8 ${compact ? "p-4 pt-10" : "p-6 pt-12"}`}>
          <div>
            <div className="border-b border-slate-400 h-10" />
            <div className="text-center text-xs text-slate-500 mt-1">Assinatura do Paciente</div>
          </div>
          <div>
            <div className="border-b border-slate-400 h-10" />
            <div className="text-center text-xs text-slate-500 mt-1">Assinatura da Clínica</div>
          </div>
        </section>
      )}

      <footer className={`text-center text-[10px] text-slate-400 ${compact ? "px-4 py-2" : "px-6 py-4"} print:pb-2`}>
        Este recibo reflete os pagamentos ativos no momento da consulta.
      </footer>
    </div>
  )
}

export default function ReceiptPage() {
  const params = useParams<{ token: string }>()
  const token = params?.token || ""

  const [data, setData] = useState<PublicReceiptResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  // Clinic users get two copies + signature lines so a single print yields
  // one copy for the patient and one kept by the clinic after cutting.
  // Detection is a silent /auth/me probe — patients stay with the single
  // layout without any visible failure.
  const [isClinic, setIsClinic] = useState(false)

  const fetchReceipt = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const resp = await api.getPublicReceipt(token)
      setData(resp)
      setNotFound(false)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchReceipt()
  }, [fetchReceipt])

  useEffect(() => {
    if (!token) return
    // Uses a silent, interceptor-free probe. Two reasons:
    // 1) a patient visitor has no session — the old /auth/me probe tripped
    //    the global 401 interceptor and redirected them to /login.
    // 2) when clinic B is logged in viewing clinic A's link we must NOT
    //    render the "via da clínica" signature slot — only the owning
    //    clinic sees the two-copy layout.
    api.isReceiptOwnedByMe(token)
      .then(setIsClinic)
      .catch(() => setIsClinic(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-xl font-semibold text-slate-800">Recibo não encontrado</h1>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          O link pode ter expirado ou o agendamento foi removido.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:py-0 print:bg-white">
      <meta name="robots" content="noindex, nofollow" />

      <div className="mx-auto w-full max-w-2xl space-y-4">
        {isClinic ? (
          <>
            <ReceiptCopy data={data} viaLabel="Via da clínica" showSignatures compact />
            {/* Visible on screen as a cut hint; on print the second via
                starts on a fresh sheet instead (see receipt-second-via). */}
            <div className="relative my-2 print:hidden">
              <div className="border-t-2 border-dashed border-slate-300" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-slate-100 px-2 text-[9px] uppercase tracking-widest text-slate-400">
                recorte aqui
              </span>
            </div>
            <div className="receipt-second-via">
              <ReceiptCopy data={data} viaLabel="Via do paciente" showSignatures compact />
            </div>
          </>
        ) : (
          <ReceiptCopy data={data} showSignatures={false} compact={false} />
        )}

        {/* Actions — hidden on print */}
        <section className="flex flex-wrap gap-3 px-1 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 transition-colors"
          >
            <Download className="h-4 w-4" /> Baixar PDF
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href)
                showToast.success("Link copiado!")
              } catch {
                showToast.error("Não foi possível copiar o link")
              }
            }}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 text-sm font-medium px-4 py-2 hover:bg-slate-50 transition-colors"
          >
            <Share2 className="h-4 w-4" /> Copiar link
          </button>
          {isClinic && (
            <span className="inline-flex items-center text-xs text-slate-500 ml-1">
              Imprimindo 2 vias em folhas separadas — uma para o paciente, outra para a clínica.
            </span>
          )}
        </section>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          nav, .print\\:hidden { display: none !important; }
          @page { margin: 12mm; }
          /* Each via prints on its own sheet so the patient copy is
             never half-cut across two pages. */
          .receipt-second-via { break-before: page; page-break-before: always; }
        }
      `}</style>
    </div>
  )
}
