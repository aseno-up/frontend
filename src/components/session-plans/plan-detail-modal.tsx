"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { X, Clock, ClipboardCheck, UserPlus, Plus, CreditCard, DollarSign, Pencil, Save, XCircle } from "lucide-react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api/client"
import { handleApiError, showToast } from "@/lib/toast"
import { SessionPlan, PlanStatus, Frequency, Enrollment } from "@/types/api"

const statusLabels: Record<PlanStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluido",
  cancelled: "Cancelado",
}

const statusStyles: Record<PlanStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  paused: "bg-amber-50 text-amber-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-50 text-red-700",
}

const frequencyLabels: Record<Frequency, string> = {
  daily: "Diario",
  weekly: "1x/sem",
  biweekly: "2x/sem",
  triweekly: "3x/sem",
  bimonthly: "Quinzenal",
  monthly: "Mensal",
  custom: "Custom.",
}

const WEEK_DAYS = [
  { value: 0, label: "Dom", abbr: "SU" },
  { value: 1, label: "Seg", abbr: "MO" },
  { value: 2, label: "Ter", abbr: "TU" },
  { value: 3, label: "Qua", abbr: "WE" },
  { value: 4, label: "Qui", abbr: "TH" },
  { value: 5, label: "Sex", abbr: "FR" },
  { value: 6, label: "Sab", abbr: "SA" },
]

interface PlanDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: SessionPlan | null
  appointments: any[]
  payments: any[]
  loading: boolean
  onOpenEnrollment: () => void
  onOpenAttendance: (appointmentId: string, sessionPlanId: string) => void
  onOpenPayment: () => void
  onOpenPaymentForEnrollment?: (enrollmentId: string) => void
  onPlanUpdated?: () => void
  refreshKey?: number
}

export function PlanDetailModal({
  open,
  onOpenChange,
  plan,
  appointments,
  payments,
  loading,
  onOpenEnrollment,
  onOpenAttendance,
  onOpenPayment,
  onOpenPaymentForEnrollment,
  onPlanUpdated,
  refreshKey,
}: PlanDetailModalProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)
  const [enrollmentPayments, setEnrollmentPayments] = useState<Record<string, any[]>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [professionals, setProfessionals] = useState<any[]>([])

  // Edit form state
  const [editFrequency, setEditFrequency] = useState<Frequency>("weekly")
  const [editWeekDays, setEditWeekDays] = useState<number[]>([])
  const [editPreferredTime, setEditPreferredTime] = useState("")
  const [editDurationMins, setEditDurationMins] = useState(50)
  const [editProfessionalId, setEditProfessionalId] = useState("")
  const [editCapacity, setEditCapacity] = useState<number | undefined>(undefined)
  const [editDayTimes, setEditDayTimes] = useState<Record<string, string>>({})

  const isGroup = plan?.type === "group"

  useEffect(() => {
    if (open && plan && isGroup) {
      setEnrollmentsLoading(true)
      api.getEnrollments(plan.id)
        .then((resp: any) => setEnrollments(resp?.data || resp || []))
        .catch(() => setEnrollments([]))
        .finally(() => setEnrollmentsLoading(false))
    }
  }, [open, plan?.id, isGroup, refreshKey])

  // Fetch payments for each enrollment in group plans
  useEffect(() => {
    if (open && plan && isGroup && enrollments.length > 0) {
      const activeEnrollments = enrollments.filter(e => e.status === "active" || e.status === "suspended")
      Promise.all(
        activeEnrollments.map(e =>
          api.getEnrollmentPayments(plan.id, e.id)
            .then((resp: any) => ({ id: e.id, payments: resp?.data || resp || [] }))
            .catch(() => ({ id: e.id, payments: [] }))
        )
      ).then(results => {
        const map: Record<string, any[]> = {}
        results.forEach(r => { map[r.id] = r.payments })
        setEnrollmentPayments(map)
      })
    }
  }, [open, plan?.id, isGroup, enrollments, refreshKey])

  useEffect(() => {
    if (!open) setIsEditing(false)
  }, [open])

  const startEditing = async () => {
    if (!plan) return
    setEditFrequency(plan.frequency)
    setEditWeekDays(plan.week_days || [])
    setEditPreferredTime(plan.preferred_time || "09:00")
    setEditDurationMins(plan.duration_mins)
    setEditProfessionalId(plan.professional_id || "")
    setEditCapacity(plan.capacity || undefined)
    setEditDayTimes(plan.day_times || {})
    setIsEditing(true)
    try {
      const resp = await api.getProfessionals({ limit: 100, status: "active" })
      setProfessionals(resp?.data || resp || [])
    } catch {}
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!plan) return
    setSaving(true)
    try {
      const payload: Record<string, any> = {}
      if (editFrequency !== plan.frequency) payload.frequency = editFrequency
      const weekDaysChanged = JSON.stringify(editWeekDays.sort()) !== JSON.stringify((plan.week_days || []).sort())
      if (weekDaysChanged) payload.week_days = editWeekDays
      if (editPreferredTime !== plan.preferred_time) payload.preferred_time = editPreferredTime
      if (editDurationMins !== plan.duration_mins) payload.duration_mins = editDurationMins
      if (editProfessionalId !== (plan.professional_id || "")) payload.professional_id = editProfessionalId || undefined
      if (isGroup && editCapacity !== plan.capacity) payload.capacity = editCapacity
      const dayTimesChanged = JSON.stringify(editDayTimes) !== JSON.stringify(plan.day_times || {})
      if (dayTimesChanged && Object.keys(editDayTimes).length > 0) payload.day_times = editDayTimes

      if (Object.keys(payload).length === 0) {
        setIsEditing(false)
        return
      }

      await api.updateSessionPlan(plan.id, payload)
      showToast.success("Plano atualizado com sucesso!")
      setIsEditing(false)
      onPlanUpdated?.()
    } catch (error) {
      handleApiError(error, "Erro ao atualizar plano")
    } finally {
      setSaving(false)
    }
  }

  const toggleWeekDay = (day: number) => {
    setEditWeekDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  const needsWeekDays = ["weekly", "biweekly", "triweekly", "bimonthly", "custom"].includes(editFrequency)

  if (!plan) return null

  const remaining = plan.total_sessions === -1
    ? "∞"
    : plan.total_sessions - plan.sessions_done
  const progressPct = plan.total_sessions === -1
    ? 0
    : Math.round(plan.progress)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
  }

  const enrollmentStatusLabel: Record<string, string> = {
    active: "Ativa",
    suspended: "Suspensa",
    cancelled: "Cancelada",
  }

  const enrollmentStatusStyle: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    suspended: "bg-amber-50 text-amber-700",
    cancelled: "bg-red-50 text-red-700",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] sm:max-h-[920px] h-[90vh] p-0 gap-0 overflow-hidden rounded-2xl [&>button]:hidden flex flex-col">
        {/* ── Header ── */}
        <div className="px-6 pt-6 shrink-0">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="min-w-0">
              <h2 className="text-[22px] font-semibold tracking-tight text-foreground leading-tight">
                {plan.title}
              </h2>
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mt-0.5 flex-wrap">
                <span>{isGroup ? "Turma" : plan.patient_name}</span>
                {plan.professional_name && (
                  <>
                    <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
                    <span>Prof. {plan.professional_name}</span>
                  </>
                )}
                {isGroup && plan.capacity && (
                  <>
                    <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
                    <span>{plan.capacity} vagas</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                  statusStyles[plan.status]
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                {statusLabels[plan.status]}
              </span>
              {!isEditing && plan.status === "active" && (
                <button
                  onClick={startEditing}
                  className="w-8 h-8 rounded-full border border-border/60 bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                  title="Editar plano"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full border border-border/60 bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ── Edit Form ── */}
          {isEditing && (
            <div className="rounded-lg border p-4 space-y-4 bg-muted/20 mb-5 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Frequência</Label>
                  <Select value={editFrequency} onValueChange={(v) => setEditFrequency(v as Frequency)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">1x/semana</SelectItem>
                      <SelectItem value="biweekly">2x/semana</SelectItem>
                      <SelectItem value="triweekly">3x/semana</SelectItem>
                      <SelectItem value="bimonthly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Horário</Label>
                  <Input
                    type="time"
                    value={editPreferredTime}
                    onChange={e => setEditPreferredTime(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {needsWeekDays && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Dias da semana</Label>
                  <div className="flex gap-1.5">
                    {WEEK_DAYS.map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleWeekDay(d.value)}
                        className={cn(
                          "w-9 h-9 rounded-lg text-xs font-medium transition-colors border",
                          editWeekDays.includes(d.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {needsWeekDays && editWeekDays.length > 1 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Horários por dia (opcional)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {editWeekDays.map(d => {
                      const day = WEEK_DAYS.find(w => w.value === d)
                      if (!day) return null
                      return (
                        <div key={d} className="flex items-center gap-2">
                          <span className="text-xs font-medium w-8">{day.label}</span>
                          <Input
                            type="time"
                            value={editDayTimes[day.abbr] || editPreferredTime}
                            onChange={e => setEditDayTimes(prev => ({ ...prev, [day.abbr]: e.target.value }))}
                            className="h-8 text-xs flex-1"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Duração (min)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={480}
                    value={editDurationMins}
                    onChange={e => setEditDurationMins(parseInt(e.target.value) || 50)}
                    className="h-9 text-sm"
                  />
                </div>
                {isGroup && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Capacidade</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={editCapacity || ""}
                      onChange={e => setEditCapacity(parseInt(e.target.value) || undefined)}
                      className="h-9 text-sm"
                    />
                  </div>
                )}
                {!isGroup && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Profissional</Label>
                    <Select value={editProfessionalId} onValueChange={setEditProfessionalId}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        {professionals.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {isGroup && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Profissional</Label>
                  <Select value={editProfessionalId} onValueChange={setEditProfessionalId}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      {professionals.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={cancelEditing} disabled={saving}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}

          {/* ── Metrics ── */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-muted/50 rounded-lg p-3.5">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">
                Realizadas
              </div>
              <div className="text-[26px] font-semibold tracking-tighter leading-none tabular-nums">
                {plan.sessions_done}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                de {plan.total_sessions === -1 ? "∞" : plan.total_sessions} sessoes
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3.5">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">
                Restantes
              </div>
              <div className="text-[26px] font-semibold tracking-tighter leading-none tabular-nums text-emerald-600">
                {remaining}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">sessoes</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3.5">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">
                Frequencia
              </div>
              <div className="text-[20px] font-semibold tracking-tight leading-none">
                {frequencyLabels[plan.frequency]}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {plan.preferred_time}
              </div>
            </div>
          </div>

          {/* ── Progress ── */}
          {plan.total_sessions !== -1 && (
            <div className="mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">
                  Progresso {isGroup ? "da turma" : "do plano"}
                </span>
                <span className="text-xs font-medium font-mono">{progressPct}%</span>
              </div>
              <div className="h-[5px] bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="agendamentos" className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 px-6">
            <TabsTrigger
              value="agendamentos"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[13px] font-normal text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold px-3.5 py-2.5 -mb-px"
            >
              Agendamentos
            </TabsTrigger>
            {isGroup && (
              <TabsTrigger
                value="alunos"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[13px] font-normal text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold px-3.5 py-2.5 -mb-px"
              >
                Alunos
              </TabsTrigger>
            )}
            <TabsTrigger
              value="pagamentos"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[13px] font-normal text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold px-3.5 py-2.5 -mb-px"
            >
              Pagamentos
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Agendamentos ── */}
          <TabsContent value="agendamentos" className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 pt-4 mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : appointments.filter((evt: any) => evt.start_time && !isNaN(new Date(evt.start_time).getTime())).length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhum agendamento encontrado.
              </p>
            ) : (
              <div className="flex flex-col gap-[7px]">
                {appointments
                  .filter((evt: any) => evt.start_time && !isNaN(new Date(evt.start_time).getTime()))
                  .map((evt: any, idx: number) => {
                    const startDate = new Date(evt.start_time)
                    const endDate = evt.end_time && !isNaN(new Date(evt.end_time).getTime())
                      ? new Date(evt.end_time)
                      : null
                    const isPast = startDate < new Date()
                    const isVirtual = evt.is_virtual
                    const isToday =
                      format(startDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

                    const statusLabel = isToday
                      ? "Hoje"
                      : isVirtual
                      ? "Agendado"
                      : evt.status === "completed"
                      ? "Concluido"
                      : evt.status === "confirmed"
                      ? "Confirmado"
                      : evt.status === "canceled"
                      ? "Cancelado"
                      : evt.status === "no_show"
                      ? "Faltou"
                      : "Agendado"

                    const badgeStyle = isToday
                      ? "bg-blue-50 text-blue-700"
                      : evt.status === "completed"
                      ? "bg-slate-100 text-slate-600"
                      : evt.status === "confirmed"
                      ? "bg-emerald-50 text-emerald-700"
                      : evt.status === "canceled"
                      ? "bg-red-50 text-red-700"
                      : evt.status === "no_show"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-emerald-50 text-emerald-700"

                    return (
                      <div
                        key={evt.id || `virtual-${idx}`}
                        className={cn(
                          "flex items-center gap-3.5 px-3.5 py-2.5 border rounded-lg transition-colors",
                          isPast && !isVirtual && !isToday ? "opacity-55" : "bg-background"
                        )}
                      >
                        {/* Date block */}
                        <div className="text-center min-w-[44px]">
                          <div className="text-[20px] font-semibold tracking-tighter leading-none tabular-nums">
                            {format(startDate, "dd")}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                            {format(startDate, "EEE", { locale: ptBR })}
                          </div>
                        </div>

                        {/* Separator */}
                        <div className="w-px h-[34px] bg-border shrink-0" />

                        {/* Meta */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium font-mono">
                            {format(startDate, "HH:mm")} – {endDate ? format(endDate, "HH:mm") : "--:--"}
                          </div>
                          {evt.professional_name && (
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">
                              Prof. {evt.professional_name}
                            </div>
                          )}
                        </div>

                        {/* Badge */}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap",
                            badgeStyle
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {statusLabel}
                        </span>

                        {/* Attendance button for group */}
                        {!isVirtual && isGroup && evt.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenAttendance(evt.id, plan.id)
                            }}
                            className="w-7 h-7 rounded-md border bg-muted/40 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0"
                            title="Registrar Presenca"
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Alunos ── */}
          {isGroup && (
            <TabsContent value="alunos" className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 pt-4 mt-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">
                  Inscritos · {enrollments.filter((e) => e.status === "active").length} de {plan.capacity || "–"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={onOpenEnrollment}
                >
                  <UserPlus className="h-3 w-3" />
                  Gerenciar
                </Button>
              </div>

              {enrollmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Nenhum aluno inscrito.
                </p>
              ) : (
                <div className="flex flex-col gap-[7px]">
                  {enrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-3 px-3.5 py-2.5 border rounded-lg"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold flex items-center justify-center shrink-0 tracking-tight">
                        {getInitials(enrollment.patient_name || "?")}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {enrollment.patient_name || "Paciente"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-px">
                          Desde {format(new Date(enrollment.joined_at), "dd/MM/yyyy")}
                        </div>
                      </div>

                      {/* Status */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full",
                          enrollmentStatusStyle[enrollment.status] || "bg-slate-100 text-slate-600"
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {enrollmentStatusLabel[enrollment.status] || enrollment.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* ── Tab: Pagamentos ── */}
          <TabsContent value="pagamentos" className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 pt-4 mt-0">
            {isGroup ? (
              <>
                {/* Group plan: payments organized by enrollment */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">
                    Pagamentos por Aluno
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 bg-emerald-500 text-white border-transparent hover:bg-emerald-600 hover:text-white"
                    onClick={onOpenPayment}
                  >
                    <Plus className="h-3 w-3" />
                    Registrar
                  </Button>
                </div>

                {enrollments.filter(e => e.status === "active" || e.status === "suspended").length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nenhum aluno inscrito
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Inscreva alunos na aba Alunos para registrar pagamentos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrollments
                      .filter(e => e.status === "active" || e.status === "suspended")
                      .map(enrollment => {
                        const epayments = enrollmentPayments[enrollment.id] || []
                        const enrollmentTotal = epayments.reduce((sum: number, p: any) => sum + (p.amount || 0) - (p.discount || 0), 0)
                        return (
                          <div key={enrollment.id} className="rounded-lg border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold flex items-center justify-center shrink-0">
                                  {(enrollment.patient_name || "?").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                                </div>
                                <div>
                                  <span className="text-sm font-medium">{enrollment.patient_name || "Paciente"}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    R$ {enrollmentTotal.toFixed(2)} pago
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[11px] gap-1"
                                onClick={() => onOpenPaymentForEnrollment?.(enrollment.id)}
                              >
                                <Plus className="h-3 w-3" />
                                Pagar
                              </Button>
                            </div>

                            {epayments.length > 0 && (
                              <div className="space-y-1 pl-9">
                                {epayments.map((pay: any) => (
                                  <div key={pay.id} className="flex items-center justify-between text-xs py-1">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <CreditCard className="h-3 w-3" />
                                      <span>{pay.payment_method_name || "Pagamento"}</span>
                                      {pay.reference_month && <span>ref: {pay.reference_month}</span>}
                                    </div>
                                    <span className="font-medium tabular-nums">
                                      R$ {(pay.amount || 0).toFixed(2)}
                                      {pay.discount > 0 && <span className="text-emerald-600 ml-1">(-R$ {pay.discount.toFixed(2)})</span>}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Individual plan: existing behavior */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">
                    Pagamentos
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 bg-emerald-500 text-white border-transparent hover:bg-emerald-600 hover:text-white"
                    onClick={onOpenPayment}
                  >
                    <Plus className="h-3 w-3" />
                    Registrar
                  </Button>
                </div>

                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nenhum pagamento registrado
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Registre o primeiro pagamento usando o botao acima.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-[7px]">
                    {payments.map((pay: any) => (
                      <div
                        key={pay.id}
                        className="flex items-center justify-between px-3.5 py-2.5 border rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">
                            {pay.payment_method_name || "Pagamento"}
                          </span>
                          {pay.installments > 1 && (
                            <span className="text-xs text-muted-foreground">
                              ({pay.installments}x)
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold tabular-nums">
                            R$ {(pay.amount || 0).toFixed(2)}
                          </span>
                          {pay.discount > 0 && (
                            <span className="text-xs text-emerald-600 ml-1">
                              (-R$ {pay.discount.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
