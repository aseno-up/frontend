"use client"

import { useCallback, useEffect, useState } from "react"
import { Users, UserPlus, Pause, Play, X, ShieldCheck, ChevronDown, Plus, Clock, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { TimePickerInline } from "@/components/ui/time-picker"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import type {
  Enrollment,
  PartnerNetwork,
  PartnerPlan,
  Patient,
  SessionPlanSlot,
} from "@/types/api"

interface EnrollmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionPlanId: string
  sessionPlanTitle: string
  capacity?: number | null
  defaultPaymentMode?: string
  planTotalSessions?: number
  planPrice?: number
  planWeekDays?: number[]
  planDayTimes?: Record<string, string>
  planPreferredTime?: string
  /** When set, the dialog opens in edit mode for that enrollment as soon as it loads. */
  editEnrollmentId?: string | null
  onOpenPaymentForEnrollment?: (enrollmentId: string) => void
}

const WEEK_DAY_LABELS: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
}

const WEEK_DAY_ABBR: Record<number, string> = {
  0: "SU",
  1: "MO",
  2: "TU",
  3: "WE",
  4: "TH",
  5: "FR",
  6: "SA",
}

function formatBRL(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  const cents = digits.padStart(3, "0")
  const reais = cents.slice(0, -2).replace(/^0+(?=\d)/, "")
  const decimals = cents.slice(-2)
  const withThousands = reais.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${withThousands || "0"},${decimals}`
}

function brlToNumber(formatted: string): number | null {
  if (!formatted.trim()) return null
  const cleaned = formatted.replace(/\./g, "").replace(",", ".")
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "success" | "warning"> = {
  active: "success",
  suspended: "warning",
  cancelled: "destructive",
}

const statusLabels: Record<string, string> = {
  active: "Ativo",
  suspended: "Suspenso",
  cancelled: "Cancelado",
}

const paymentModeLabels: Record<string, string> = {
  per_session: "Por sessão",
  upfront: "Antecipado",
  monthly: "Mensal",
}

interface PartnerPlanOption extends PartnerPlan {
  network_name: string
}

export function EnrollmentDialog({
  open,
  onOpenChange,
  sessionPlanId,
  sessionPlanTitle,
  capacity,
  defaultPaymentMode,
  planTotalSessions,
  planPrice,
  planWeekDays = [],
  planDayTimes,
  planPreferredTime,
  editEnrollmentId,
  onOpenPaymentForEnrollment,
}: EnrollmentDialogProps) {
  const timeForDay = (day: number): string | null => {
    const abbr = WEEK_DAY_ABBR[day]
    if (planDayTimes && planDayTimes[abbr]) return planDayTimes[abbr]
    return planPreferredTime || null
  }

  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [enrolling, setEnrolling] = useState(false)
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<string | null>(null)

  // Slot-based plan support
  const [slots, setSlots] = useState<SessionPlanSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  // Inline slot creation per day
  const [expandedDay, setExpandedDay] = useState<number | null>(null)
  const [creatingSlotDay, setCreatingSlotDay] = useState<number | null>(null)
  const [newSlotTime, setNewSlotTime] = useState("")
  const [creatingSlot, setCreatingSlot] = useState(false)

  // Partner plan support
  const [partnerPlans, setPartnerPlans] = useState<PartnerPlanOption[]>([])

  // Form state for adding a patient
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([])
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([])
  const [selectedPartnerPlanId, setSelectedPartnerPlanId] = useState<string>("")
  const [totalSessions, setTotalSessions] = useState<string>("")
  const [paymentMode, setPaymentMode] = useState(defaultPaymentMode || "per_session")
  const [monthlyAmount, setMonthlyAmount] = useState("")
  const [billingDay, setBillingDay] = useState("")

  const usingSlots = slots.length > 0
  const activeSlots = slots.filter((s) => s.is_active)

  const toggleWeekDay = (day: number) => {
    setSelectedWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const toggleSlot = (slotId: string) => {
    setSelectedSlotIds((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    )
  }

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<{
    type: string
    enrollmentId: string
    name: string
  } | null>(null)

  const fetchEnrollments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getEnrollments(sessionPlanId)
      setEnrollments(data.data || data || [])
    } catch (error) {
      handleApiError(error, "Erro ao carregar inscrições")
    } finally {
      setLoading(false)
    }
  }, [sessionPlanId])

  const fetchPatients = useCallback(async () => {
    try {
      const data = await api.getPatients({ limit: 200 })
      setPatients(data.data || [])
    } catch {}
  }, [])

  const fetchSlots = useCallback(async () => {
    setSlotsLoading(true)
    try {
      const res: any = await api.getSessionPlanSlots(sessionPlanId)
      setSlots(res.data || [])
    } catch {
      // 404 is OK — slots endpoint may not exist on legacy plan flow
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [sessionPlanId])

  const fetchPartnerPlans = useCallback(async () => {
    try {
      const res: any = await api.getActivePartnerNetworks()
      const networks: PartnerNetwork[] = res.data || []
      const flat: PartnerPlanOption[] = []
      networks.forEach((n) => {
        ;(n.plans || []).forEach((p) => {
          if (p.is_active) flat.push({ ...p, network_name: n.name })
        })
      })
      setPartnerPlans(flat)
    } catch {
      setPartnerPlans([])
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchEnrollments()
      fetchPatients()
      fetchSlots()
      fetchPartnerPlans()
    }
  }, [open, fetchEnrollments, fetchPatients, fetchSlots, fetchPartnerPlans])

  // Auto-enter edit mode when opened with an editEnrollmentId.
  useEffect(() => {
    if (!open || !editEnrollmentId) return
    const enrollment = enrollments.find((e) => e.id === editEnrollmentId)
    if (enrollment && editingEnrollmentId !== editEnrollmentId) {
      openEditEnrollment(enrollment)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editEnrollmentId, enrollments])

  // Pre-fill monthly amount when payment mode changes to monthly
  useEffect(() => {
    if (paymentMode === "monthly" && planPrice) {
      setMonthlyAmount(formatBRL(String(Math.round(planPrice * 100))))
    }
    if (paymentMode !== "monthly") {
      setMonthlyAmount("")
    }
  }, [paymentMode, planPrice])

  const activeCount = enrollments.filter((e) => e.status === "active").length

  const resetForm = () => {
    setShowAddForm(false)
    setEditingEnrollmentId(null)
    setSelectedPatientId("")
    setSelectedWeekDays([])
    setSelectedSlotIds([])
    setSelectedPartnerPlanId("")
    setTotalSessions("")
    setPaymentMode(defaultPaymentMode || "per_session")
    setMonthlyAmount("")
    setBillingDay("")
    setExpandedDay(null)
    setCreatingSlotDay(null)
    setNewSlotTime("")
  }

  const openEditEnrollment = (enrollment: Enrollment) => {
    setEditingEnrollmentId(enrollment.id)
    setSelectedPatientId(enrollment.patient_id)
    setSelectedWeekDays(enrollment.week_days || [])
    setSelectedSlotIds(enrollment.slot_ids || [])
    setSelectedPartnerPlanId(enrollment.partner_plan_id || "")
    setTotalSessions(
      enrollment.total_sessions != null ? String(enrollment.total_sessions) : ""
    )
    setPaymentMode(enrollment.payment_mode)
    setMonthlyAmount(
      enrollment.monthly_amount
        ? formatBRL(String(Math.round(enrollment.monthly_amount * 100)))
        : ""
    )
    setBillingDay(enrollment.billing_day != null ? String(enrollment.billing_day) : "")
    setShowAddForm(true)
  }

  const handleCreateSlotInline = async (weekday: number) => {
    if (!newSlotTime || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(newSlotTime)) {
      showToast.error("Informe um horário válido (HH:MM)")
      return
    }
    // Reject duplicate (same weekday + time) before hitting API
    if (slots.some((s) => s.weekday === weekday && s.start_time === newSlotTime)) {
      showToast.error("Já existe um horário neste dia e hora")
      return
    }
    setCreatingSlot(true)
    try {
      const created: any = await api.createSessionPlanSlot(sessionPlanId, {
        weekday,
        start_time: newSlotTime,
        capacity: capacity && capacity > 0 ? capacity : 1,
        professional_id: null,
      })
      const newSlot: SessionPlanSlot = created.data ?? created
      setSlots((prev) => [...prev, newSlot])
      // Auto-select the just-created slot for the enrollment
      setSelectedSlotIds((prev) =>
        prev.includes(newSlot.id) ? prev : [...prev, newSlot.id]
      )
      setNewSlotTime("")
      setCreatingSlotDay(null)
      showToast.success("Horário criado")
    } catch (e) {
      handleApiError(e, "Erro ao criar horário")
    } finally {
      setCreatingSlot(false)
    }
  }

  const handleEnroll = async () => {
    if (!selectedPatientId) {
      showToast.error("Selecione um paciente")
      return
    }

    if (usingSlots) {
      if (selectedSlotIds.length === 0) {
        showToast.error("Selecione pelo menos um horário")
        return
      }
    } else if (selectedWeekDays.length === 0) {
      showToast.error("Selecione pelo menos um dia da semana")
      return
    }

    // Validate against partner plan max_sessions_per_week before hitting the API
    if (selectedPartnerPlanId) {
      const pp = partnerPlans.find((p) => p.id === selectedPartnerPlanId)
      if (pp?.max_sessions_per_week) {
        const used = usingSlots ? selectedSlotIds.length : selectedWeekDays.length
        if (used > pp.max_sessions_per_week) {
          showToast.error(
            `O plano ${pp.network_name} ${pp.name} permite no máximo ${pp.max_sessions_per_week} sessão${
              pp.max_sessions_per_week === 1 ? "" : "es"
            } por semana.`
          )
          return
        }
      }
    }

    if (totalSessions && planTotalSessions && planTotalSessions > 0) {
      if (parseInt(totalSessions) > planTotalSessions) {
        showToast.error(`Total de sessões não pode exceder ${planTotalSessions}`)
        return
      }
    }

    if (paymentMode === "monthly") {
      const bd = parseInt(billingDay, 10)
      if (!billingDay || isNaN(bd) || bd < 1 || bd > 31) {
        showToast.error("Dia de cobrança é obrigatório para mensalidade (1 a 31)")
        return
      }
    }

    setEnrolling(true)
    try {
      const amount = brlToNumber(monthlyAmount)
      let result: any
      if (editingEnrollmentId) {
        result = await api.updateEnrollment(sessionPlanId, editingEnrollmentId, {
          week_days: usingSlots ? undefined : selectedWeekDays,
          slot_ids: usingSlots ? selectedSlotIds : undefined,
          partner_plan_id: selectedPartnerPlanId || undefined,
          clear_partner_plan: !selectedPartnerPlanId,
          total_sessions: totalSessions ? parseInt(totalSessions) : undefined,
          payment_mode: paymentMode,
          monthly_amount: amount ?? undefined,
          billing_day: billingDay ? parseInt(billingDay) : undefined,
        })
        showToast.success("Inscrição atualizada com sucesso!")
      } else {
        result = await api.enrollPatient(sessionPlanId, {
          patient_id: selectedPatientId,
          week_days: usingSlots ? undefined : selectedWeekDays,
          slot_ids: usingSlots ? selectedSlotIds : undefined,
          partner_plan_id: selectedPartnerPlanId || null,
          total_sessions: totalSessions ? parseInt(totalSessions) : undefined,
          payment_mode: paymentMode,
          monthly_amount: amount ?? undefined,
          billing_day: billingDay ? parseInt(billingDay) : undefined,
        })
        showToast.success("Paciente inscrito com sucesso!")
      }

      const enrollmentId = result?.id || result?.data?.id
      const wasCreating = !editingEnrollmentId

      resetForm()
      fetchEnrollments()

      if (wasCreating && paymentMode === "upfront" && enrollmentId && onOpenPaymentForEnrollment) {
        onOpenChange(false)
        setTimeout(() => onOpenPaymentForEnrollment(enrollmentId), 200)
      }
    } catch (error) {
      handleApiError(
        error,
        editingEnrollmentId ? "Erro ao atualizar inscrição" : "Erro ao inscrever paciente"
      )
    } finally {
      setEnrolling(false)
    }
  }

  const handleAction = async () => {
    if (!confirmAction) return
    try {
      switch (confirmAction.type) {
        case "suspend":
          await api.suspendEnrollment(sessionPlanId, confirmAction.enrollmentId)
          showToast.success("Inscrição suspensa")
          break
        case "reactivate":
          await api.reactivateEnrollment(sessionPlanId, confirmAction.enrollmentId)
          showToast.success("Inscrição reativada")
          break
        case "cancel":
          await api.cancelEnrollment(sessionPlanId, confirmAction.enrollmentId)
          showToast.success("Inscrição cancelada")
          break
      }
      fetchEnrollments()
    } catch (error) {
      handleApiError(error, "Erro ao atualizar inscrição")
    } finally {
      setConfirmAction(null)
    }
  }

  // Filter patients already enrolled
  const enrolledPatientIds = new Set(enrollments.map((e) => e.patient_id))
  const availablePatients = patients.filter((p) => !enrolledPatientIds.has(p.id))
  const patientOptions: SelectOption[] = availablePatients.map((p) => ({
    value: p.id,
    label: p.name,
  }))

  const partnerPlanOptions: SelectOption[] = partnerPlans.map((p) => ({
    value: p.id,
    label: `${p.network_name} — ${p.name}${
      p.max_sessions_per_week ? ` (${p.max_sessions_per_week}x/sem)` : ""
    }`,
  }))

  const hasSessionLimit = planTotalSessions != null && planTotalSessions > 0

  // Capacity hint string for the dialog header.
  const capacityHint = (() => {
    if (usingSlots) {
      const total = activeSlots.length
      return total === 0
        ? null
        : ` · ${total} ${total === 1 ? "horário ativo" : "horários ativos"}`
    }
    return capacity ? ` · capacidade ${capacity} por dia` : ""
  })()

  // Group active slots by weekday for the slot picker.
  const slotsByWeekday: Record<number, SessionPlanSlot[]> = {}
  activeSlots.forEach((s) => {
    if (!slotsByWeekday[s.weekday]) slotsByWeekday[s.weekday] = []
    slotsByWeekday[s.weekday].push(s)
  })
  Object.values(slotsByWeekday).forEach((arr) =>
    arr.sort((a, b) => a.start_time.localeCompare(b.start_time))
  )
  const orderedWeekdays = Object.keys(slotsByWeekday)
    .map(Number)
    .sort((a, b) => a - b)

  // Days to show in the disponibilidade picker:
  // union of (a) days that have slots, (b) days the plan declares via WeekDays.
  // If still empty, fall back to weekdays Mon-Sat (closest to "open").
  const availableDays: number[] = (() => {
    const set = new Set<number>(orderedWeekdays)
    planWeekDays.forEach((d) => set.add(d))
    if (set.size === 0) [1, 2, 3, 4, 5, 6].forEach((d) => set.add(d))
    return Array.from(set).sort((a, b) => a - b)
  })()

  const fullDayLabel = (day: number): string =>
    ({
      0: "Domingo",
      1: "Segunda-feira",
      2: "Terça-feira",
      3: "Quarta-feira",
      4: "Quinta-feira",
      5: "Sexta-feira",
      6: "Sábado",
    })[day] || ""

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-[680px]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Alunos Inscritos
            </DialogTitle>
            <DialogDescription>
              {sessionPlanTitle} — {activeCount}{" "}
              {activeCount === 1 ? "aluno ativo" : "alunos ativos"}
              {capacityHint}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto py-2">
            {!showAddForm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="w-full"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Paciente
              </Button>
            ) : (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    {editingEnrollmentId ? "Editar inscrição" : "Novo Aluno"}
                  </Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => resetForm()}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Paciente</Label>
                  {editingEnrollmentId ? (
                    <div className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm font-medium">
                      {patients.find((p) => p.id === selectedPatientId)?.name ||
                        enrollments.find((e) => e.id === editingEnrollmentId)?.patient_name ||
                        "Paciente"}
                    </div>
                  ) : (
                    <ReactSelect
                      options={patientOptions}
                      value={patientOptions.find((o) => o.value === selectedPatientId) || null}
                      onChange={(option) => setSelectedPatientId(option ? option.value : "")}
                      placeholder="Selecione um paciente..."
                      isClearable
                      isSearchable
                    />
                  )}
                </div>

                {/* Disponibilidade — accordion per weekday */}
                {slotsLoading ? (
                  <div className="text-xs text-muted-foreground">Carregando horários...</div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Disponibilidade</Label>
                      {(usingSlots ? selectedSlotIds.length : selectedWeekDays.length) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (usingSlots) setSelectedSlotIds([])
                            else setSelectedWeekDays([])
                          }}
                          className="text-[11px] text-primary hover:underline"
                        >
                          Limpar seleção
                        </button>
                      )}
                    </div>

                    <div className="overflow-hidden rounded-lg border bg-background">
                      <ul className="divide-y">
                        {availableDays.map((day) => {
                          const isExpanded = expandedDay === day
                          const daySlots = slotsByWeekday[day] || []
                          const selectedCount = daySlots.filter((s) =>
                            selectedSlotIds.includes(s.id)
                          ).length
                          const legacySelected =
                            !usingSlots && selectedWeekDays.includes(day)

                          return (
                            <li key={day}>
                              <button
                                type="button"
                                onClick={() => {
                                  // Slot-based plans: expand to choose / create slots.
                                  // Legacy plans without slots: clicking toggles weekday directly.
                                  if (usingSlots || daySlots.length > 0) {
                                    setExpandedDay(isExpanded ? null : day)
                                    setCreatingSlotDay(null)
                                  } else {
                                    // First click on a day with no slots opens the inline create.
                                    setExpandedDay(isExpanded ? null : day)
                                    setCreatingSlotDay(day)
                                    setNewSlotTime("")
                                  }
                                }}
                                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 ${
                                  isExpanded ? "bg-muted/30" : ""
                                }`}
                              >
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold uppercase ${
                                    selectedCount > 0 || legacySelected
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {WEEK_DAY_LABELS[day]}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-foreground">
                                    {fullDayLabel(day)}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {usingSlots
                                      ? daySlots.length === 0
                                        ? "Nenhum horário cadastrado"
                                        : `${daySlots.length} ${
                                            daySlots.length === 1
                                              ? "horário disponível"
                                              : "horários disponíveis"
                                          }${
                                            selectedCount > 0
                                              ? ` · ${selectedCount} selecionado${selectedCount === 1 ? "" : "s"}`
                                              : ""
                                          }`
                                      : timeForDay(day)
                                        ? `Horário: ${timeForDay(day)}`
                                        : "Sem horário fixo"}
                                  </div>
                                </div>
                                <ChevronDown
                                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              {isExpanded && (
                                <div className="space-y-2 border-t bg-muted/20 px-3 pb-3 pt-2">
                                  {/* Slot chips (slot-based plans) OR weekday toggle (legacy) */}
                                  {usingSlots ? (
                                    daySlots.length === 0 ? (
                                      <p className="text-[11px] italic text-muted-foreground">
                                        Nenhum horário cadastrado para este dia ainda.
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                                        {daySlots.map((slot) => {
                                          const selected = selectedSlotIds.includes(slot.id)
                                          return (
                                            <button
                                              key={slot.id}
                                              type="button"
                                              onClick={() => toggleSlot(slot.id)}
                                              className={`flex flex-col items-center gap-0.5 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                                                selected
                                                  ? "border-primary bg-primary text-primary-foreground"
                                                  : "border-input bg-background hover:bg-accent"
                                              }`}
                                            >
                                              <span className="font-bold tabular-nums">
                                                {slot.start_time}
                                              </span>
                                              <span
                                                className={`text-[10px] ${
                                                  selected
                                                    ? "text-primary-foreground/80"
                                                    : "text-muted-foreground"
                                                }`}
                                              >
                                                cap {slot.capacity}
                                              </span>
                                            </button>
                                          )
                                        })}
                                      </div>
                                    )
                                  ) : (
                                    // Legacy mode (no slots yet): a single fixed time per weekday.
                                    <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs font-medium">
                                          {timeForDay(day) || "Sem horário fixo"}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => toggleWeekDay(day)}
                                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                          legacySelected
                                            ? "bg-primary text-primary-foreground"
                                            : "border border-input bg-background hover:bg-accent"
                                        }`}
                                      >
                                        {legacySelected ? "Selecionado" : "Selecionar"}
                                      </button>
                                    </div>
                                  )}

                                  {/* Inline slot create */}
                                  {creatingSlotDay === day ? (
                                    <div className="flex items-center gap-2 rounded-md border border-dashed border-primary/40 bg-background p-2">
                                      <TimePickerInline
                                        value={newSlotTime}
                                        onChange={(v) => setNewSlotTime(v)}
                                        interval={10}
                                        placeholder="HH:MM"
                                        className="h-8 w-24 px-2"
                                      />
                                      <span className="text-[10px] text-muted-foreground">
                                        cap {capacity && capacity > 0 ? capacity : 1} ·
                                        qualquer profissional
                                      </span>
                                      <div className="ml-auto flex items-center gap-1">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2 text-xs"
                                          onClick={() => {
                                            setCreatingSlotDay(null)
                                            setNewSlotTime("")
                                          }}
                                          disabled={creatingSlot}
                                        >
                                          Cancelar
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          className="h-7 px-2.5 text-xs"
                                          onClick={() => handleCreateSlotInline(day)}
                                          disabled={creatingSlot || !newSlotTime}
                                        >
                                          {creatingSlot ? "..." : "Criar"}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCreatingSlotDay(day)
                                        setNewSlotTime("")
                                      }}
                                      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-background hover:text-primary"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                      Adicionar horário neste dia
                                    </button>
                                  )}
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>

                    {(usingSlots ? selectedSlotIds.length : selectedWeekDays.length) > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {usingSlots
                          ? `${selectedSlotIds.length}x por semana`
                          : `${selectedWeekDays.length}x por semana`}
                      </span>
                    )}
                  </div>
                )}

                {/* Partner plan select — only shown when there are active partner plans */}
                {partnerPlans.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      Convênio (opcional)
                    </Label>
                    <ReactSelect
                      options={[
                        { value: "", label: "Pagamento direto (sem convênio)" },
                        ...partnerPlanOptions,
                      ]}
                      value={
                        selectedPartnerPlanId
                          ? partnerPlanOptions.find(
                              (o) => o.value === selectedPartnerPlanId
                            ) || null
                          : { value: "", label: "Pagamento direto (sem convênio)" }
                      }
                      onChange={(option) =>
                        setSelectedPartnerPlanId(option ? option.value : "")
                      }
                      isClearable={false}
                      isSearchable
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Quando preenchido, o limite semanal do plano é validado.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Total de sessões</Label>
                    <Input
                      type="number"
                      min={1}
                      max={hasSessionLimit ? planTotalSessions : undefined}
                      placeholder={hasSessionLimit ? `Máx: ${planTotalSessions}` : "Indeterminado"}
                      value={totalSessions}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val && hasSessionLimit && parseInt(val) > planTotalSessions!) {
                          setTotalSessions(planTotalSessions!.toString())
                        } else {
                          setTotalSessions(val)
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {hasSessionLimit
                        ? `Limite do plano: ${planTotalSessions}. Vazio = limite do plano.`
                        : "Vazio = indeterminado."}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Modo de pagamento</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_session">Por sessão</SelectItem>
                        <SelectItem value="upfront">Antecipado</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {paymentMode === "monthly" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Valor mensal</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          R$
                        </span>
                        <Input
                          inputMode="numeric"
                          placeholder="0,00"
                          value={monthlyAmount}
                          onChange={(e) => setMonthlyAmount(formatBRL(e.target.value))}
                          className="h-8 pl-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Dia de cobrança <span className="text-destructive">*</span>
                      </Label>
                      <Select value={billingDay} onValueChange={setBillingDay}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Dia do mês" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[260px]">
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <SelectItem key={d} value={String(d)}>
                              Dia {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={handleEnroll}
                  disabled={!selectedPatientId || enrolling}
                  className="w-full"
                >
                  {enrolling
                    ? editingEnrollmentId
                      ? "Salvando..."
                      : "Inscrevendo..."
                    : editingEnrollmentId
                      ? "Salvar alterações"
                      : "Inscrever Paciente"}
                </Button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : enrollments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum aluno inscrito.
              </p>
            ) : (
              <div className="space-y-2">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {enrollment.patient_name || "Paciente"}
                        </span>
                        <Badge
                          variant={statusVariants[enrollment.status]}
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {statusLabels[enrollment.status]}
                        </Badge>
                        {enrollment.partner_plan_id && (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            Convênio
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{paymentModeLabels[enrollment.payment_mode]}</span>
                        <span>
                          {enrollment.sessions_done}/
                          {enrollment.total_sessions != null ? enrollment.total_sessions : "∞"}{" "}
                          sessões
                        </span>
                      </div>
                      {(() => {
                        const enrolledSlots = (enrollment.slot_ids || [])
                          .map((id) => slots.find((s) => s.id === id))
                          .filter((s): s is SessionPlanSlot => !!s)
                          .sort(
                            (a, b) =>
                              a.weekday - b.weekday || a.start_time.localeCompare(b.start_time)
                          )
                        if (enrolledSlots.length > 0) {
                          return (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {enrolledSlots.map((slot) => (
                                <span
                                  key={slot.id}
                                  className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary"
                                >
                                  {WEEK_DAY_LABELS[slot.weekday]} {slot.start_time}
                                </span>
                              ))}
                            </div>
                          )
                        }
                        if (enrollment.week_days && enrollment.week_days.length > 0) {
                          return (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {enrollment.week_days.map((d) => (
                                <span
                                  key={d}
                                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground"
                                >
                                  {WEEK_DAY_LABELS[d]}
                                </span>
                              ))}
                            </div>
                          )
                        }
                        return null
                      })()}
                      {enrollment.total_sessions != null && enrollment.total_sessions > 0 && (
                        <Progress value={enrollment.progress} className="mt-1.5 h-1" />
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {enrollment.status !== "cancelled" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Editar"
                          onClick={() => openEditEnrollment(enrollment)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {enrollment.status === "active" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Suspender"
                            onClick={() =>
                              setConfirmAction({
                                type: "suspend",
                                enrollmentId: enrollment.id,
                                name: enrollment.patient_name || "",
                              })
                            }
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            title="Cancelar"
                            onClick={() =>
                              setConfirmAction({
                                type: "cancel",
                                enrollmentId: enrollment.id,
                                name: enrollment.patient_name || "",
                              })
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {enrollment.status === "suspended" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Reativar"
                            onClick={() =>
                              setConfirmAction({
                                type: "reactivate",
                                enrollmentId: enrollment.id,
                                name: enrollment.patient_name || "",
                              })
                            }
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            title="Cancelar"
                            onClick={() =>
                              setConfirmAction({
                                type: "cancel",
                                enrollmentId: enrollment.id,
                                name: enrollment.patient_name || "",
                              })
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
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
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        onConfirm={handleAction}
        title={
          confirmAction?.type === "suspend"
            ? "Suspender Inscrição"
            : confirmAction?.type === "reactivate"
              ? "Reativar Inscrição"
              : "Cancelar Inscrição"
        }
        description={
          confirmAction?.type === "suspend"
            ? `Tem certeza que deseja suspender a inscrição de ${confirmAction?.name}?`
            : confirmAction?.type === "reactivate"
              ? `Tem certeza que deseja reativar a inscrição de ${confirmAction?.name}?`
              : `Tem certeza que deseja cancelar a inscrição de ${confirmAction?.name}? Esta ação não pode ser desfeita.`
        }
      />
    </>
  )
}
