"use client"

import { useCallback, useEffect, useState } from "react"
import { ClipboardCheck, UserPlus, Check, X, Minus, Search, CreditCard, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import { Enrollment, AttendanceStatus, Patient } from "@/types/api"
import { PlanPaymentDialog } from "./plan-payment-dialog"

interface GroupAttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId?: string
  sessionPlanId: string
  sessionDate?: string // YYYY-MM-DD for group attendance without appointment
  /**
   * Slot id of the clicked occurrence (slot-based group plans). When set,
   * enrollments are filtered to those that include this specific slot
   * instead of falling back to the broader weekday filter.
   */
  slotId?: string
}

interface AttendanceEntry {
  patientId: string
  patientName: string
  status: AttendanceStatus | null
  isGuest: boolean
  existing: boolean // true if already recorded in DB
  enrollmentId?: string
  paymentMethodId?: string
  paymentAmount?: number
  sessionsDone?: number
  totalSessions?: number | null
  paymentMode?: string // per_session, upfront, monthly
}

interface PaymentMethod {
  id: string
  name: string
  type: string
}

const statusConfig: Record<AttendanceStatus, { label: string; icon: React.ReactNode; color: string }> = {
  present: { label: "Presente", icon: <Check className="h-3.5 w-3.5" />, color: "bg-green-100 text-green-800 hover:bg-green-200" },
  absent: { label: "Ausente", icon: <X className="h-3.5 w-3.5" />, color: "bg-red-100 text-red-800 hover:bg-red-200" },
  substituted: { label: "Substituto", icon: <Minus className="h-3.5 w-3.5" />, color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" },
}

export function GroupAttendanceDialog({ open, onOpenChange, appointmentId, sessionPlanId, sessionDate, slotId }: GroupAttendanceDialogProps) {
  const [entries, setEntries] = useState<AttendanceEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Guest add state
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [guestSearch, setGuestSearch] = useState("")
  const [allPatients, setAllPatients] = useState<Patient[]>([])

  // Payment methods for guest payment
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  // Payment dialog state (for per_session enrolled students)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentEnrollmentId, setPaymentEnrollmentId] = useState<string | undefined>()

  // Session professional state
  const [sessionProfessionalId, setSessionProfessionalId] = useState<string | null>(null)
  const [sessionProfessionalName, setSessionProfessionalName] = useState<string | null>(null)
  const [planProfessionalId, setPlanProfessionalId] = useState<string | null>(null)
  const [planProfessionalName, setPlanProfessionalName] = useState<string | null>(null)
  const [professionals, setProfessionals] = useState<Array<{ id: string; name: string }>>([])
  const [savingProfessional, setSavingProfessional] = useState(false)

  const isFixedProfessional = !!planProfessionalId
  const effectiveProfessionalId = sessionProfessionalId || planProfessionalId
  const effectiveProfessionalName = sessionProfessionalName || planProfessionalName
  const hasProfessional = !!effectiveProfessionalId

  const loadData = useCallback(async () => {
    if (!sessionPlanId) return
    setLoading(true)
    try {
      // Load enrollments + attendance (from appointment OR group attendance endpoint)
      const [enrollmentsResp, attendanceResp] = await Promise.all([
        api.getEnrollments(sessionPlanId),
        appointmentId
          ? api.getAttendance(appointmentId)
          : sessionDate
            ? api.getGroupAttendance(sessionPlanId, sessionDate)
            : Promise.resolve({ data: [] }),
      ])

      const enrollments: Enrollment[] = enrollmentsResp.data || enrollmentsResp || []
      const rawRecords: Array<{ patient_id: string; status: AttendanceStatus; is_guest: boolean; patient_name?: string }> = attendanceResp.data || []

      const attendanceMap = new Map<string, { status: AttendanceStatus; is_guest: boolean; patient_name?: string }>()
      rawRecords.forEach(r => attendanceMap.set(r.patient_id, r))

      const newEntries: AttendanceEntry[] = []

      // Slot-based plans (the clicked event has a slotId): filter strictly by
      // slot membership so a 9h event doesn't show students enrolled at 11h
      // on the same weekday.
      // Legacy plans without slots: fall back to the broader weekday filter.
      const weekDayFilter = sessionDate
        ? new Date(sessionDate + "T00:00:00Z").getUTCDay()
        : null

      const matchesSession = (e: Enrollment): boolean => {
        if (slotId) {
          return Array.isArray(e.slot_ids) && e.slot_ids.includes(slotId)
        }
        if (weekDayFilter === null) return true
        if (!e.week_days || e.week_days.length === 0) return true
        return e.week_days.includes(weekDayFilter)
      }

      // Add all active enrollments with their session counts
      enrollments
        .filter(e => e.status === "active")
        .filter(matchesSession)
        .forEach(e => {
          const existing = attendanceMap.get(e.patient_id)
          newEntries.push({
            patientId: e.patient_id,
            patientName: e.patient_name || "Paciente",
            status: existing?.status || null,
            isGuest: false,
            existing: !!existing,
            enrollmentId: e.id,
            sessionsDone: e.sessions_done,
            totalSessions: e.total_sessions,
            paymentMode: e.payment_mode,
          })
          attendanceMap.delete(e.patient_id)
        })

      // Add guest records (patients not in enrollment but with attendance)
      attendanceMap.forEach((record, patientId) => {
        if (record.is_guest) {
          newEntries.push({
            patientId,
            patientName: record.patient_name || "Convidado",
            status: record.status,
            isGuest: true,
            existing: true,
          })
        }
      })

      setEntries(newEntries)
    } catch (error) {
      handleApiError(error, "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [appointmentId, sessionPlanId, sessionDate, slotId])

  useEffect(() => {
    if (open) {
      // Reset state on open to avoid stale data from previous dialog
      setPlanProfessionalId(null)
      setPlanProfessionalName(null)
      setSessionProfessionalId(null)
      setSessionProfessionalName(null)
      setProfessionals([])

      loadData()
      // Load payment methods for guest payments
      api.getPaymentMethods().then((data: { data?: PaymentMethod[] }) => {
        setPaymentMethods(data.data || [])
      }).catch(() => {})

      // Load session plan to check professional type and procedure
      api.getSessionPlan(sessionPlanId).then((resp: { data?: { professional_id?: string; professional_name?: string; procedure_id?: string | null } }) => {
        const plan = resp.data
        console.log('[GroupAttendance] Plan loaded:', { professional_id: plan?.professional_id, professional_name: plan?.professional_name, procedure_id: plan?.procedure_id })
        if (plan?.professional_id) {
          setPlanProfessionalId(plan.professional_id)
          setPlanProfessionalName(plan.professional_name || null)
        } else {
          setPlanProfessionalId(null)
          setPlanProfessionalName(null)
          // Load only professionals with commission for this procedure
          if (plan?.procedure_id) {
            api.getProfessionalsByProcedure(plan.procedure_id).then((pResp) => {
              setProfessionals((pResp.data || []).map(p => ({ id: p.professional_id, name: p.professional_name })))
            }).catch(() => {})
          } else {
            // Fallback: load all active professionals if no procedure
            api.getProfessionals({ limit: 100, status: "active" }).then((pResp: { data?: Array<{ id: string; name: string }> }) => {
              setProfessionals(pResp.data || [])
            }).catch(() => {})
          }
        }
      }).catch((err) => {
        console.error('[GroupAttendance] Error loading plan:', err)
      })

      // Load session professional assignment (if any)
      if (sessionDate) {
        api.getSessionProfessional(sessionPlanId, sessionDate).then((resp) => {
          const data = resp.data
          console.log('[GroupAttendance] Session professional loaded:', data)
          if (data) {
            setSessionProfessionalId(data.professional_id)
            setSessionProfessionalName(data.professional_name || null)
          } else {
            setSessionProfessionalId(null)
            setSessionProfessionalName(null)
          }
        }).catch((err) => {
          console.error('[GroupAttendance] Error loading session professional:', err)
          setSessionProfessionalId(null)
          setSessionProfessionalName(null)
        })
      }
    }
  }, [open, loadData, sessionPlanId, sessionDate])

  const handleProfessionalChange = async (professionalId: string) => {
    if (!sessionDate) return
    setSavingProfessional(true)
    try {
      const resp = await api.setSessionProfessional(sessionPlanId, sessionDate, professionalId)
      const data = resp.data
      setSessionProfessionalId(data.professional_id)
      setSessionProfessionalName(data.professional_name || professionals.find(p => p.id === professionalId)?.name || null)
      showToast.success("Profissional atribuído")
    } catch (error) {
      handleApiError(error, "Erro ao atribuir profissional")
    } finally {
      setSavingProfessional(false)
    }
  }

  const setStatus = (patientId: string, status: AttendanceStatus) => {
    setEntries(prev => prev.map(e => {
      if (e.patientId !== patientId) return e
      // Toggle: clicking the same status deselects it
      return { ...e, status: e.status === status ? null : status }
    }))
  }

  const markAllPresent = () => {
    setEntries(prev => prev.map(e => ({ ...e, status: "present" as AttendanceStatus })))
  }

  const updatePayment = (patientId: string, field: 'paymentMethodId' | 'paymentAmount', value: string | number) => {
    setEntries(prev => prev.map(e => {
      if (e.patientId !== patientId) return e
      return { ...e, [field]: value }
    }))
  }

  const handleSave = async () => {
    // Only send entries that have a status selected
    const entriesToSave = entries.filter(e => e.status !== null)
    if (entriesToSave.length === 0) return

    setSaving(true)
    try {
      if (appointmentId) {
        // Individual appointment flow (existing)
        await Promise.all(
          entriesToSave.map(entry => {
            const data: {
              patient_id: string
              status: AttendanceStatus
              is_guest: boolean
              payment_method_id?: string
              payment_amount?: number
            } = {
              patient_id: entry.patientId,
              status: entry.status as AttendanceStatus,
              is_guest: entry.isGuest,
            }

            if (entry.status === "present" && entry.paymentMethodId && entry.paymentAmount && entry.paymentAmount > 0) {
              data.payment_method_id = entry.paymentMethodId
              data.payment_amount = entry.paymentAmount
            }

            return api.recordAttendance(appointmentId, data)
          })
        )
      } else if (sessionDate) {
        // Group attendance flow (new endpoint)
        await api.recordGroupAttendance(sessionPlanId, {
          date: sessionDate,
          entries: entriesToSave.map(entry => {
            const data: any = {
              patient_id: entry.patientId,
              status: entry.status as AttendanceStatus,
              is_guest: entry.isGuest,
            }
            if (entry.isGuest && entry.status === "present" && entry.paymentMethodId && entry.paymentAmount && entry.paymentAmount > 0) {
              data.payment_method_id = entry.paymentMethodId
              data.payment_amount = entry.paymentAmount
            }
            return data
          }),
        })
      }
      showToast.success("Presença registrada com sucesso!")
      onOpenChange(false)
    } catch (error) {
      handleApiError(error, "Erro ao registrar presença")
    } finally {
      setSaving(false)
    }
  }

  const handleAddGuest = async (patient: Patient) => {
    // Check not already in list
    if (entries.some(e => e.patientId === patient.id)) {
      showToast.error("Paciente já está na lista")
      return
    }

    setEntries(prev => [...prev, {
      patientId: patient.id,
      patientName: patient.name,
      status: "present",
      isGuest: true,
      existing: false,
    }])
    setShowAddGuest(false)
    setGuestSearch("")
  }

  const loadPatients = useCallback(async () => {
    try {
      const data = await api.getPatients({ limit: 200 })
      setAllPatients(data.data || [])
    } catch {}
  }, [])

  useEffect(() => {
    if (showAddGuest && allPatients.length === 0) {
      loadPatients()
    }
  }, [showAddGuest, allPatients.length, loadPatients])

  const filteredPatients = guestSearch
    ? allPatients.filter(p => p.name.toLowerCase().includes(guestSearch.toLowerCase()) && !entries.some(e => e.patientId === p.id))
    : []

  const hasGuestPayments = entries.some(e => e.isGuest && e.status === "present" && e.paymentMethodId && e.paymentAmount && e.paymentAmount > 0)
  const hasSelectedEntries = entries.some(e => e.status !== null)

  return (
  <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {(appointmentId || sessionDate) ? "Registro de Presença" : "Alunos da Turma"}
          </DialogTitle>
          <DialogDescription>
            {(appointmentId || sessionDate) ? "Marque a presença dos alunos nesta sessão" : "Alunos inscritos nesta turma"}
          </DialogDescription>

          {/* Professional assignment section */}
          {sessionDate && (
            <div className="flex items-center gap-2 pt-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              {isFixedProfessional ? (
                <span className="text-sm font-medium">{effectiveProfessionalName || "Profissional fixo"}</span>
              ) : (
                <Select
                  value={sessionProfessionalId || ""}
                  onValueChange={handleProfessionalChange}
                  disabled={savingProfessional}
                >
                  <SelectTrigger className="h-8 text-sm flex-1">
                    <SelectValue placeholder="Selecione o profissional desta sessão" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-sm">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum aluno inscrito nesta turma.</p>
          ) : (
            <>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={markAllPresent}>
                  <Check className="h-3 w-3 mr-1" />
                  Todos Presentes
                </Button>
              </div>

              <div className="space-y-2">
                {entries.map(entry => (
                  <div key={entry.patientId} className="rounded-lg border p-3 text-sm space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{entry.patientName}</span>
                          {entry.isGuest && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Convidado</Badge>
                          )}
                        </div>
                        {!entry.isGuest && entry.sessionsDone != null && (
                          <div className="text-[10px] text-muted-foreground">
                            {entry.sessionsDone}/{entry.totalSessions != null ? entry.totalSessions : "∞"} sessões
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {(["present", "absent", "substituted"] as AttendanceStatus[]).map(s => (
                          <button
                            key={s}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                              entry.status === s ? statusConfig[s].color : "bg-muted/50 text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground"
                            }`}
                            onClick={() => setStatus(entry.patientId, s)}
                          >
                            {statusConfig[s].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Per-session enrolled student: "Pagar" button */}
                    {!entry.isGuest && entry.paymentMode === "per_session" && entry.enrollmentId && (
                      <div className="flex items-center gap-2 pt-1 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5"
                          disabled={!hasProfessional}
                          title={!hasProfessional ? "Selecione um profissional antes de registrar pagamento" : undefined}
                          onClick={() => {
                            setPaymentEnrollmentId(entry.enrollmentId)
                            setPaymentDialogOpen(true)
                          }}
                        >
                          <CreditCard className="h-3 w-3" />
                          Pagar sessão
                        </Button>
                        {!hasProfessional && (
                          <span className="text-[10px] text-amber-600">Selecione o profissional acima</span>
                        )}
                      </div>
                    )}

                    {/* Guest payment: inline fields (guests don't have enrollments) */}
                    {entry.status === "present" && entry.isGuest && !entry.existing && paymentMethods.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 border-t">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <Select
                          value={entry.paymentMethodId || ""}
                          onValueChange={(v) => updatePayment(entry.patientId, 'paymentMethodId', v)}
                        >
                          <SelectTrigger className="h-7 text-xs flex-1">
                            <SelectValue placeholder="Forma de pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map(pm => (
                              <SelectItem key={pm.id} value={pm.id} className="text-xs">{pm.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Valor"
                          value={entry.paymentAmount || ""}
                          onChange={(e) => updatePayment(entry.patientId, 'paymentAmount', parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs w-24"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Add guest section */}
          {!showAddGuest ? (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAddGuest(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Convidado
            </Button>
          ) : (
            <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Adicionar Convidado</Label>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddGuest(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  value={guestSearch}
                  onChange={e => setGuestSearch(e.target.value)}
                  className="h-8 text-sm pl-7"
                />
              </div>
              {guestSearch && filteredPatients.length > 0 && (
                <div className="max-h-[100px] overflow-y-auto border rounded-md">
                  {filteredPatients.slice(0, 8).map(p => (
                    <button
                      key={p.id}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => handleAddGuest(p)}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {(appointmentId || sessionDate) ? "Cancelar" : "Fechar"}
          </Button>
          {(appointmentId || sessionDate) && (
            <Button onClick={handleSave} disabled={saving || !hasSelectedEntries}>
              {saving ? "Salvando..." : hasGuestPayments ? "Salvar Presença e Pagamento" : "Salvar Presença"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Payment dialog for per_session enrolled students */}
    <PlanPaymentDialog
      open={paymentDialogOpen}
      onOpenChange={setPaymentDialogOpen}
      sessionPlanId={sessionPlanId}
      enrollmentId={paymentEnrollmentId}
      paymentMode="per_session"
      sessionDate={sessionDate}
      isGroup
    />
  </>
  )
}
