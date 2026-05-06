"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, Search, FileText, X, ChevronLeft, ChevronRight, ArrowRightCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Header } from "@/components/dashboard/header"
import { AgendaVendasTabs } from "@/components/dashboard/agenda-vendas-tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SalesPackageDialog } from "@/components/dashboard/sales-package-dialog"
import { SalesPackageWhatsAppButton } from "@/components/dashboard/sales-package-whatsapp-button"
import { api } from "@/lib/api/client"
import { handleApiError, showToast } from "@/lib/toast"
import { formatPhone } from "@/lib/utils"
import type { SalesPackage, SalesPackageStatus } from "@/types/api"

interface VendasPageProps {
  params: Promise<{ lng: string }>
}

const STATUS_LABELS: Record<SalesPackageStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  quote:     { label: "Orçamento", variant: "outline" },
  active:    { label: "Ativa",     variant: "default" },
  completed: { label: "Concluída", variant: "secondary" },
  canceled:  { label: "Cancelada", variant: "destructive" },
}

export default function VendasPage({ params }: VendasPageProps) {
  const [lng, setLng] = useState("pt-BR")
  const [packages, setPackages] = useState<SalesPackage[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<SalesPackageStatus | "">("")
  const [loading, setLoading] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"sale" | "quote">("sale")
  const [editingPackage, setEditingPackage] = useState<SalesPackage | null>(null)

  const [cancelTarget, setCancelTarget] = useState<SalesPackage | null>(null)

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await api.getSalesPackages({
        page,
        per_page: perPage,
        q: query.trim() || undefined,
        status: statusFilter || undefined,
      })
      setPackages(resp.data || [])
      setTotal(resp.total || 0)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }, [page, perPage, query, statusFilter])

  useEffect(() => {
    const handler = setTimeout(fetchPackages, 250)
    return () => clearTimeout(handler)
  }, [fetchPackages])

  const handleNewSale = () => {
    setEditingPackage(null)
    setDialogMode("sale")
    setDialogOpen(true)
  }

  const handleNewQuote = () => {
    setEditingPackage(null)
    setDialogMode("quote")
    setDialogOpen(true)
  }

  const handleRowClick = (pkg: SalesPackage) => {
    setEditingPackage(pkg)
    setDialogMode(pkg.status === "quote" ? "quote" : "sale")
    setDialogOpen(true)
  }

  const handleConvertQuote = (pkg: SalesPackage) => {
    setEditingPackage(pkg)
    setDialogMode("sale") // open the dialog already in "convert" mode
    setDialogOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    try {
      await api.cancelSalesPackage(cancelTarget.id)
      showToast.success("Venda cancelada")
      setCancelTarget(null)
      fetchPackages()
    } catch (err) {
      handleApiError(err)
    }
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total, perPage])

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Vendas" />

      <div className="flex-1 p-4 md:p-6">
        <div className="mb-4">
          <AgendaVendasTabs active="vendas" />
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setPage(1)
                  setQuery(e.target.value)
                }}
                placeholder="Buscar por cliente, telefone, procedimento ou código…"
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => {
                setPage(1)
                setStatusFilter(v === "all" ? "" : (v as SalesPackageStatus))
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="quote">Orçamento</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleNewQuote}>
              <FileText className="mr-2 h-4 w-4" />
              Novo Orçamento
            </Button>
            <Button onClick={handleNewSale}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Venda
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Procedimentos</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    Nenhuma venda encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg) => {
                  const meta = STATUS_LABELS[pkg.status]
                  const itemsSummary = (pkg.items || [])
                    .map((it) => {
                      const balance = pkg.items_balance?.find((b) => b.item_id === it.id)
                      const used = balance?.used ?? 0
                      return `${it.procedure?.name || "Proc."} (${used}/${it.quantity})`
                    })
                    .join(", ")
                  return (
                    <TableRow
                      key={pkg.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(pkg)}
                    >
                      <TableCell className="font-mono text-xs">{pkg.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{pkg.patient_name || pkg.patient_id}</span>
                          {pkg.patient_phone && (
                            <span className="text-xs text-muted-foreground">
                              {formatPhone(pkg.patient_phone)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(pkg.sale_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                        {itemsSummary}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {pkg.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SalesPackageWhatsAppButton
                            pkg={pkg}
                            size="icon"
                            variant="ghost"
                            title={pkg.status === "quote" ? "Enviar orçamento pelo WhatsApp" : "Enviar recibo pelo WhatsApp"}
                          />
                          {pkg.status === "quote" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Converter orçamento em venda"
                              onClick={() => handleConvertQuote(pkg)}
                            >
                              <ArrowRightCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {pkg.status !== "canceled" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Cancelar venda"
                              onClick={() => setCancelTarget(pkg)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total === 0
              ? "Nenhum resultado"
              : `${(page - 1) * perPage + 1}-${Math.min(page * perPage, total)} de ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="px-2">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <SalesPackageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        existing={editingPackage}
        onSuccess={() => {
          setDialogOpen(false)
          fetchPackages()
        }}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Cancelar venda?"
        description={`A venda ${cancelTarget?.code} será cancelada. As entradas financeiras associadas permanecem para conferência manual.`}
        confirmText="Cancelar venda"
        variant="destructive"
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}
