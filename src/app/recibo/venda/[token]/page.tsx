"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Download, Loader2, MapPin, Phone, Share2 } from "lucide-react"

import { api } from "@/lib/api/client"
import type { PublicSalesReceiptResponse } from "@/types/api"
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
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")
}

const STATUS_LABEL: Record<PublicSalesReceiptResponse["status"], string> = {
  quote: "Orçamento",
  active: "Venda ativa",
  completed: "Venda concluída",
  canceled: "Venda cancelada",
}

export default function SalesReceiptPage() {
  const params = useParams<{ token: string }>()
  const token = params?.token || ""

  const [data, setData] = useState<PublicSalesReceiptResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const fetchReceipt = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const resp = await api.getPublicSalesReceipt(token)
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
          O link pode ter expirado ou a venda foi removida.
        </p>
      </div>
    )
  }

  const headingLabel = data.status === "quote" ? "Orçamento" : "Recibo"

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:py-0 print:bg-white">
      <meta name="robots" content="noindex, nofollow" />

      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="bg-white rounded-xl shadow-sm">
          <header className="flex items-start justify-between border-b p-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">{headingLabel}</div>
              <div className="mt-1 font-bold text-slate-900 text-lg">{data.receipt_number}</div>
              <div className="text-xs text-slate-400 mt-1">
                Emitido em {formatDateTime(data.generated_at)}
              </div>
              <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] uppercase tracking-wider text-slate-600">
                {STATUS_LABEL[data.status]}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-900 text-lg">{data.clinic.name}</div>
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

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b p-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Cliente</div>
              <div className="mt-1 text-sm font-medium text-slate-800">{data.patient_name}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Data da venda</div>
              <div className="mt-1 text-sm font-medium text-slate-800">{formatDateOnly(data.sale_date)}</div>
            </div>
            {data.valid_until && (
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-400">Validade</div>
                <div className="mt-1 text-sm font-medium text-slate-800">{formatDateOnly(data.valid_until)}</div>
              </div>
            )}
          </section>

          <section className="border-b p-6">
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">Procedimentos</div>
            {data.items.length === 0 ? (
              <p className="text-sm text-slate-500">Sem procedimentos registrados.</p>
            ) : (
              <ul className="divide-y">
                {data.items.map((it, i) => (
                  <li key={i} className="flex justify-between items-start py-2 text-sm">
                    <div>
                      <div className="text-slate-700">{it.name}</div>
                      <div className="text-xs text-slate-400">
                        {it.quantity} sessão(ões) × {formatCurrency(it.unit_price)}
                      </div>
                    </div>
                    <span className="font-medium text-slate-800">{formatCurrency(it.line_total)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(data.subtotal)}</span>
              </div>
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

          <section className="p-6">
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">Pagamentos</div>
            {data.payments.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum pagamento registrado.</p>
            ) : (
              <ul className="divide-y">
                {data.payments.map((p, i) => (
                  <li key={i} className="flex justify-between items-start py-2 text-sm">
                    <div>
                      <div className="text-slate-700">{p.method || "Em aberto"}</div>
                      <div className="text-xs text-slate-400">
                        {p.paid_at
                          ? `Pago em ${formatDateOnly(p.paid_at)}`
                          : `Vence em ${formatDateOnly(p.due_date)}`}
                      </div>
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

          <footer className="text-center text-[10px] text-slate-400 px-6 py-4 print:pb-2">
            Este {headingLabel.toLowerCase()} reflete os pagamentos ativos no momento da emissão.
          </footer>
        </div>

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
        </section>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          nav, .print\\:hidden { display: none !important; }
          @page { margin: 12mm; }
        }
      `}</style>
    </div>
  )
}
