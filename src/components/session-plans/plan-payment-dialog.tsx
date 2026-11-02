"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DollarSign, CreditCard, Trash2, ChevronDown, Calendar, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReactSelect, SelectOption } from "@/components/ui/react-select"
import { CurrencyInput } from "@/components/ui/currency-input"
import { DatePicker } from "@/components/ui/date-picker"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import { PlanPayment, Enrollment } from "@/types/api"
import { cn } from "@/lib/utils"

interface PlanPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionPlanId: string
  enrollmentId?: string
  paymentMode?: string
  isGroup?: boolean
  enrollments?: Enrollment[]
  sessionDate?: string // YYYY-MM-DD — locks payment to a specific session date
}

interface AppointmentGroup {
  appointmentId: string
  startTime: string
  price: number
  payments: PlanPayment[]
  totalPaid: number
  totalCovered: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

export function PlanPaymentDialog({ open, onOpenChange, sessionPlanId, enrollmentId, paymentMode, isGroup, enrollments, sessionDate }: PlanPaymentDialogProps) {
  const [payments, setPayments] = useState<PlanPayment[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<any>(null)
  const [sessionPrice, setSessionPrice] = useState(0)

  // Selected enrollment for group plans (when no enrollmentId is pre-set)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("")

  // The effective enrollment ID (from prop or user selection)
  const effectiveEnrollmentId = enrollmentId || selectedEnrollmentId || ""

  // Form state
  const [methodId, setMethodId] = useState("")
  const [amount, setAmount] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [installments, setInstallments] = useState(1)
  const [referenceMonth, setReferenceMonth] = useState("") // YYYY-MM
  const [paidAt, setPaidAt] = useState<string>(() => new Date().toISOString().slice(0, 10)) // YYYY-MM-DD
  const [notes, setNotes] = useState("")

  // Split reference month into month + year parts for the dual-select picker
  const [refYear, refMonth] = referenceMonth ? referenceMonth.split("-") : ["", ""]
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i))
  const monthOptions = [
    { v: "01", l: "Janeiro" },
    { v: "02", l: "Fevereiro" },
    { v: "03", l: "Março" },
    { v: "04", l: "Abril" },
    { v: "05", l: "Maio" },
    { v: "06", l: "Junho" },
    { v: "07", l: "Julho" },
    { v: "08", l: "Agosto" },
    { v: "09", l: "Setembro" },
    { v: "10", l: "Outubro" },
    { v: "11", l: "Novembro" },
    { v: "12", l: "Dezembro" },
  ]
  const setRefMonthPart = (m: string) => setReferenceMonth(`${refYear || String(currentYear)}-${m}`)
  const setRefYearPart = (y: string) => setReferenceMonth(`${y}-${refMonth || "01"}`)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Accordion state for per-session groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Determine effective payment mode from selected enrollment or prop
  const selectedEnrollment = enrollments?.find(e => e.id === effectiveEnrollmentId)
  const effectivePaymentMode = selectedEnrollment?.payment_mode || paymentMode


  // Reset selected enrollment when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedEnrollmentId("")
      setExpandedGroups(new Set())
    }
  }, [open])

  const fetchData = useCallback(async () => {
    if (!sessionPlanId) return
    setLoading(true)
    try {
      const [paymentsResp, methodsResp, statusResp, planResp] = await Promise.all([
        effectiveEnrollmentId
          ? api.getEnrollmentPayments(sessionPlanId, effectiveEnrollmentId)
          : api.getPlanPayments(sessionPlanId),
        api.getActivePaymentMethods(),
        api.getPlanPaymentStatus(sessionPlanId).catch(() => null),
        api.getSessionPlan(sessionPlanId).catch(() => null),
      ])

      setPayments((paymentsResp as any)?.data || paymentsResp || [])
      const methods = (methodsResp as any)?.data || methodsResp || []
      setPaymentMethods(methods)
      setPaymentStatus(statusResp)

      // Extract session price from plan (price_override takes precedence over session_price)
      const plan = (planResp as any)?.data || planResp
      if (plan) {
        const price = plan.price_override ?? plan.session_price ?? 0
        setSessionPrice(price)
        // Pre-fill amount if not already set
        if (amount === 0 && price > 0) {
          setAmount(price)
        }
      }

      if (methods.length > 0 && !methodId) {
        setMethodId(methods[0].id)
      }
    } catch (error) {
      handleApiError(error, "Erro ao carregar pagamentos")
    } finally {
      setLoading(false)
    }
  }, [sessionPlanId, effectiveEnrollmentId, methodId, amount])

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, fetchData])

  const resetForm = () => {
    setAmount(sessionPrice || 0)
    setDiscount(0)
    setInstallments(1)
    setReferenceMonth("")
    setPaidAt(new Date().toISOString().slice(0, 10))
    setNotes("")
  }

  const handleSubmit = async () => {
    if (isGroup && !enrollmentId && !selectedEnrollmentId) {
      showToast.error("Selecione um paciente")
      return
    }
    if (!methodId) {
      showToast.error("Selecione um método de pagamento")
      return
    }
    if (amount <= 0) {
      showToast.error("Valor deve ser maior que zero")
      return
    }
    if (isPerSession && sessionDate && sessionPrice > 0) {
      const remainingForSession = sessionPrice - totalPaid
      if (amount > remainingForSession + 0.01) {
        showToast.error(`Valor máximo para esta sessão: R$ ${remainingForSession.toFixed(2)}`)
        return
      }
    }

    setSubmitting(true)
    try {
      const data = {
        payment_method_id: methodId,
        amount,
        discount: discount || undefined,
        installments: installments || 1,
        reference_month: referenceMonth || undefined,
        session_date: sessionDate || undefined,
        paid_at: paidAt ? new Date(paidAt + "T12:00:00").toISOString() : undefined,
        notes: notes || undefined,
      }

      if (effectiveEnrollmentId) {
        await api.createEnrollmentPayment(sessionPlanId, effectiveEnrollmentId, data)
      } else {
        await api.createPlanPayment(sessionPlanId, data)
      }

      showToast.success("Pagamento registrado com sucesso!")
      resetForm()
      fetchData()
    } catch (error) {
      handleApiError(error, "Erro ao registrar pagamento")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.deletePlanPayment(sessionPlanId, deleteTarget)
      showToast.success("Pagamento removido")
      setDeleteTarget(null)
      fetchData()
    } catch (error) {
      handleApiError(error, "Erro ao remover pagamento")
    }
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const isPerSession = effectivePaymentMode === "per_session"

  // When viewing a specific session, only show payments for that date
  const visiblePayments = sessionDate
    ? payments.filter(p => p.session_date === sessionDate)
    : payments

  const totalPaid = visiblePayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalDiscount = visiblePayments.reduce((sum, p) => sum + (p.discount || 0), 0)

  // Group payments by session_date (group plans) or appointment (individual plans)
  const appointmentGroups = useMemo((): AppointmentGroup[] => {
    if (!isPerSession) return []

    const groupMap = new Map<string, AppointmentGroup>()

    for (const pay of visiblePayments) {
      // Use session_date as key for group plans, appointment_id for individual
      const key = pay.session_date || pay.appointment_id || "unknown"
      const dateDisplay = pay.session_date || pay.appointment_start_time || ""
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          appointmentId: key,
          startTime: dateDisplay,
          price: pay.appointment_price || 0,
          payments: [],
          totalPaid: 0,
          totalCovered: 0,
        })
      }
      const group = groupMap.get(key)!
      group.payments.push(pay)
      group.totalPaid += pay.amount || 0
      group.totalCovered += (pay.amount || 0) + (pay.discount || 0)
    }

    return Array.from(groupMap.values()).sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    )
  }, [visiblePayments, isPerSession])

  // Build enrollment options for group select
  const activeEnrollments = enrollments?.filter(e => e.status === "active") || []
  const enrollmentOptions: SelectOption[] = activeEnrollments.map(e => ({
    value: e.id,
    label: e.patient_name || "Paciente",
  }))

  const showEnrollmentSelector = isGroup && !enrollmentId

  const formatAppointmentDate = (dateStr: string) => {
    if (!dateStr) return "Data desconhecida"
    try {
      // session_date is YYYY-MM-DD (10 chars), appointment_start_time is ISO datetime
      if (dateStr.length === 10) {
        const [y, m, d] = dateStr.split("-")
        return format(new Date(+y, +m - 1, +d), "dd 'de' MMM, yyyy", { locale: ptBR })
      }
      return format(new Date(dateStr), "dd 'de' MMM', ' HH:mm", { locale: ptBR })
    } catch {
      return "Data desconhecida"
    }
  }

  const formatPaymentDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return ""
    try {
      return format(new Date(dateStr), "dd/MM/yy HH:mm")
    } catch {
      return ""
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {sessionDate ? "Pagamento da Sessão" : "Pagamentos do Plano"}
            </DialogTitle>
            <DialogDescription>
              {sessionDate && sessionPrice > 0 && (
                <span>Valor da sessão: {formatCurrency(sessionPrice)} · </span>
              )}
              Total pago: {formatCurrency(totalPaid)}
              {totalDiscount > 0 && ` (desc. ${formatCurrency(totalDiscount)})`}
              {paymentStatus?.is_fully_paid && " — Plano quitado"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {isPerSession && !(effectiveEnrollmentId && sessionDate) ? (
              /* Per-session read-only: no form, just history grouped by session/appointment */
              <div className="rounded-lg border border-dashed p-3 text-center space-y-0.5 bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  {effectiveEnrollmentId
                    ? "Pagamentos por sessão — registre pelo calendário ao marcar presença."
                    : "Pagamentos registrados nos agendamentos vinculados a este plano."}
                </p>
              </div>
            ) : (
            /* Payment form for upfront/monthly */
            <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
              <Label className="text-sm font-semibold">Novo Pagamento</Label>

              {/* Enrollment selector for group plans */}
              {showEnrollmentSelector && (
                <div className="space-y-1">
                  <Label className="text-xs">Paciente</Label>
                  <ReactSelect
                    options={enrollmentOptions}
                    value={enrollmentOptions.find(o => o.value === selectedEnrollmentId) || null}
                    onChange={(option) => setSelectedEnrollmentId(option ? option.value : "")}
                    placeholder="Selecione o paciente..."
                    isClearable
                    isSearchable
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Método</Label>
                  <Select value={methodId} onValueChange={setMethodId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm: any) => (
                        <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Valor (R$)</Label>
                  <CurrencyInput
                    value={amount}
                    onChange={setAmount}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Desconto (R$)</Label>
                  <CurrencyInput
                    value={discount}
                    onChange={setDiscount}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Parcelas</Label>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={installments}
                    onChange={e => setInstallments(parseInt(e.target.value) || 1)}
                    className="h-8 text-sm"
                  />
                </div>
                {effectivePaymentMode === "monthly" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Ref. mês</Label>
                    <div className="flex gap-1.5">
                      <Select value={refMonth} onValueChange={setRefMonthPart}>
                        <SelectTrigger className="h-8 text-sm flex-1">
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[260px]">
                          {monthOptions.map(m => (
                            <SelectItem key={m.v} value={m.v}>
                              {m.l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={refYear} onValueChange={setRefYearPart}>
                        <SelectTrigger className="h-8 text-sm w-[82px]">
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map(y => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Data do pagamento</Label>
                <DatePicker
                  value={paidAt}
                  onChange={(v) => setPaidAt(v)}
                  className="h-8 text-sm"
                />
                <span className="text-[11px] text-muted-foreground">
                  Quando o aluno efetivamente pagou (pode ser retroativo).
                </span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Observações</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Opcional..."
                  className="h-16 text-sm resize-none"
                />
              </div>

              <Button size="sm" onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? "Registrando..." : "Registrar Pagamento"}
              </Button>
            </div>
            )}

            {/* Existing payments */}
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : isPerSession ? (
              /* Per-session: grouped by appointment */
              appointmentGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2 text-center">Nenhum pagamento registrado nos agendamentos.</p>
              ) : (
                <div className="space-y-2">
                  {appointmentGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.appointmentId)
                    const isPaid = group.price > 0 && group.totalCovered >= group.price

                    return (
                      <div key={group.appointmentId} className="rounded-lg border overflow-hidden">
                        {/* Accordion header */}
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.appointmentId)}
                          className="w-full flex items-center gap-2 p-3 text-sm hover:bg-muted/50 transition-colors"
                        >
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium">
                            {formatAppointmentDate(group.startTime)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({group.payments.length} pgto{group.payments.length !== 1 ? "s" : ""})
                          </span>
                          <div className="ml-auto flex items-center gap-2">
                            {group.price > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(group.totalPaid)} / {formatCurrency(group.price)}
                              </span>
                            )}
                            {isPaid ? (
                              <Badge className="text-[10px] bg-green-600 h-5">
                                <Check className="h-3 w-3 mr-0.5" />
                                Pago
                              </Badge>
                            ) : group.totalPaid > 0 && group.price > 0 ? (
                              <Badge variant="outline" className="text-[10px] h-5 text-amber-600 border-amber-300">
                                Parcial
                              </Badge>
                            ) : null}
                            <ChevronDown className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180"
                            )} />
                          </div>
                        </button>

                        {/* Accordion content */}
                        {isExpanded && (
                          <div className="border-t bg-muted/20 divide-y">
                            {group.payments.map((pay) => (
                              <div key={pay.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                  <CreditCard className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="text-xs font-medium truncate">{pay.payment_method_name || "Pagamento"}</span>
                                  {pay.installments > 1 && (
                                    <span className="text-[11px] text-muted-foreground">({pay.installments}x)</span>
                                  )}
                                  {pay.notes && (
                                    <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">{pay.notes}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-[11px] text-muted-foreground/70">
                                    {formatPaymentDate(pay.paid_at)}
                                  </span>
                                  <div className="text-right">
                                    <span className="font-bold text-xs">{formatCurrency(pay.amount || 0)}</span>
                                    {pay.discount > 0 && (
                                      <span className="text-[11px] text-green-600 ml-1">(-{formatCurrency(pay.discount)})</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            ) : visiblePayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">Nenhum pagamento registrado.</p>
            ) : (
              /* Flat list for upfront/monthly */
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Histórico</Label>
                {visiblePayments.map((pay) => (
                  <div key={pay.id} className="rounded-lg border p-3 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{pay.payment_method_name || "Pagamento"}</span>
                        {pay.installments > 1 && <span className="text-xs text-muted-foreground">({pay.installments}x)</span>}
                        {pay.reference_month && <span className="text-xs text-muted-foreground">ref: {pay.reference_month}</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="font-bold">{formatCurrency(pay.amount || 0)}</span>
                          {pay.discount > 0 && <span className="text-xs text-green-600 ml-1">(-{formatCurrency(pay.discount)})</span>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteTarget(pay.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      {pay.session_date && (
                        <span>Sessão: {formatAppointmentDate(pay.session_date)}</span>
                      )}
                      {pay.paid_at && (
                        <span>Pago em: {formatPaymentDate(pay.paid_at)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remover Pagamento"
        description="Tem certeza que deseja remover este pagamento?"
      />
    </>
  )
}
