"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ExternalLink, FileText, Loader2, Package } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api/client"
import { handleApiError } from "@/lib/toast"
import type { SalesPackage, SalesPackageStatus } from "@/types/api"

interface PatientPackagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  patientName?: string
}

const STATUS_LABELS: Record<SalesPackageStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  quote:     { label: "Orçamento", variant: "outline" },
  active:    { label: "Ativa",     variant: "default" },
  completed: { label: "Concluída", variant: "secondary" },
  canceled:  { label: "Cancelada", variant: "destructive" },
}

// Cap the dialog at this many rows. Heavy users go to /vendas?patient_id=...
// for full search/pagination; this dialog is just a quick reference inside
// the booking flow.
const PAGE_LIMIT = 20

// PatientPackagesDialog lists the patient's sales/orçamentos with payment
// summary per row (paid vs receivable). Read-only, but each row links to the
// printable receipt and to the full Vendas tab if the user needs to take
// action.
export function PatientPackagesDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
}: PatientPackagesDialogProps) {
  const params = useParams<{ lng: string }>()
  const lng = params?.lng || "pt-BR"

  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState<SalesPackage[]>([])
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<SalesPackageStatus | "all">("active")
  const [openingReceipt, setOpeningReceipt] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !patientId) return
    setLoading(true)
    api
      .getSalesPackages({
        patient_id: patientId,
        per_page: PAGE_LIMIT,
        status: statusFilter === "all" ? undefined : statusFilter,
      })
      .then((resp) => {
        setPackages(resp.data || [])
        setTotal(resp.total || 0)
      })
      .catch(handleApiError)
      .finally(() => setLoading(false))
  }, [open, patientId, statusFilter])

  const hasMore = total > packages.length

  const handleOpenReceipt = async (pkg: SalesPackage) => {
    setOpeningReceipt(pkg.id)
    try {
      const resp = await api.ensureSalesPackageReceiptToken(pkg.id)
      window.open(resp.public_url, "_blank", "noopener")
    } catch (e) {
      handleApiError(e)
    } finally {
      setOpeningReceipt(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pacotes de {patientName || "paciente"}
          </DialogTitle>
          <DialogDescription>
            Vendas vinculadas a este paciente, com saldo restante por procedimento e
            situação financeira.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Apenas ativas</SelectItem>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="quote">Orçamentos</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
              <SelectItem value="canceled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Link
            href={`/${lng}/vendas?patient_id=${patientId}`}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            target="_blank"
          >
            Ver na tela de Vendas
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : packages.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum pacote encontrado para este filtro.
            </p>
          ) : (
            <>
              {packages.map((pkg) => {
                const meta = STATUS_LABELS[pkg.status]
                // Sum payments by realized vs open-receivable. Method-less rows
                // are open receivables (unpaid sale balance the user hasn't
                // assigned a method to yet).
                let paid = 0
                let receivable = 0
                ;(pkg.payments || []).forEach((p) => {
                  const net = p.amount - p.discount
                  if (p.paid_at) {
                    paid += net
                  } else {
                    receivable += net
                  }
                })
                return (
                  <div key={pkg.id} className="rounded-md border bg-card p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{pkg.code}</span>
                        <Badge variant={meta.variant} className="text-[10px]">
                          {meta.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(pkg.sale_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Abrir recibo em nova aba"
                          onClick={() => handleOpenReceipt(pkg)}
                          disabled={openingReceipt === pkg.id}
                        >
                          {openingReceipt === pkg.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {pkg.items && pkg.items.length > 0 && (
                      <ul className="space-y-1">
                        {pkg.items.map((it) => {
                          const balance = pkg.items_balance?.find((b) => b.item_id === it.id)
                          const used = balance?.used ?? 0
                          const remaining = it.quantity - used
                          return (
                            <li
                              key={it.id}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <span className="text-foreground">
                                {it.procedure?.name || "Procedimento"}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>
                                  {used}/{it.quantity} usadas
                                </span>
                                {remaining > 0 && pkg.status === "active" && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {remaining} disponível{remaining === 1 ? "" : "is"}
                                  </Badge>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-muted-foreground">
                          Total <b className="text-foreground">R$ {pkg.total.toFixed(2)}</b>
                        </span>
                        <span className="text-emerald-700">
                          Pago <b>R$ {paid.toFixed(2)}</b>
                        </span>
                        {receivable > 0.005 && (
                          <span className="text-amber-700">
                            A receber <b>R$ {receivable.toFixed(2)}</b>
                          </span>
                        )}
                      </div>
                      {receivable > 0.005 && pkg.status === "active" && (
                        <Link
                          href={`/${lng}/vendas?patient_id=${patientId}`}
                          target="_blank"
                          className="text-xs text-primary underline-offset-2 hover:underline"
                        >
                          Registrar pagamento
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}

              {hasMore && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  Mostrando {packages.length} de {total}.{" "}
                  <Link
                    href={`/${lng}/vendas?patient_id=${patientId}`}
                    target="_blank"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Ver todas em Vendas
                  </Link>
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
