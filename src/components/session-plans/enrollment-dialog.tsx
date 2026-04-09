"use client"

import { useCallback, useEffect, useState } from "react"
import { Users, UserPlus, Pause, Play, X, CreditCard } from "lucide-react"

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
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import { Enrollment, Patient } from "@/types/api"

interface EnrollmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionPlanId: string
  sessionPlanTitle: string
  capacity?: number | null
  defaultPaymentMode?: string
  planTotalSessions?: number
  planPrice?: number
  onOpenPaymentForEnrollment?: (enrollmentId: string) => void
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

export function EnrollmentDialog({
  open,
  onOpenChange,
  sessionPlanId,
  sessionPlanTitle,
  capacity,
  defaultPaymentMode,
  planTotalSessions,
  planPrice,
  onOpenPaymentForEnrollment,
}: EnrollmentDialogProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [enrolling, setEnrolling] = useState(false)

  // Form state for adding a patient
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [totalSessions, setTotalSessions] = useState<string>("")
  const [paymentMode, setPaymentMode] = useState(defaultPaymentMode || "per_session")
  const [monthlyAmount, setMonthlyAmount] = useState("")
  const [billingDay, setBillingDay] = useState("")

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<{ type: string; enrollmentId: string; name: string } | null>(null)

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

  useEffect(() => {
    if (open) {
      fetchEnrollments()
      fetchPatients()
    }
  }, [open, fetchEnrollments, fetchPatients])

  // Pre-fill monthly amount when payment mode changes to monthly
  useEffect(() => {
    if (paymentMode === "monthly" && planPrice) {
      setMonthlyAmount(planPrice.toString())
    }
    if (paymentMode !== "monthly") {
      setMonthlyAmount("")
    }
  }, [paymentMode, planPrice])

  const activeCount = enrollments.filter(e => e.status === "active").length

  const handleEnroll = async () => {
    if (!selectedPatientId) {
      showToast.error("Selecione um paciente")
      return
    }

    // Validate total sessions against plan limit
    if (totalSessions && planTotalSessions && planTotalSessions > 0) {
      if (parseInt(totalSessions) > planTotalSessions) {
        showToast.error(`Total de sessões não pode exceder ${planTotalSessions}`)
        return
      }
    }

    setEnrolling(true)
    try {
      const result = await api.enrollPatient(sessionPlanId, {
        patient_id: selectedPatientId,
        total_sessions: totalSessions ? parseInt(totalSessions) : undefined,
        payment_mode: paymentMode,
        monthly_amount: monthlyAmount ? parseFloat(monthlyAmount) : undefined,
        billing_day: billingDay ? parseInt(billingDay) : undefined,
      })
      showToast.success("Paciente inscrito com sucesso!")

      const enrollmentId = result?.id || result?.data?.id

      setShowAddForm(false)
      setSelectedPatientId("")
      setTotalSessions("")
      setPaymentMode(defaultPaymentMode || "per_session")
      setMonthlyAmount("")
      setBillingDay("")
      fetchEnrollments()

      // For upfront payments, close enrollment dialog and open payment dialog
      if (paymentMode === "upfront" && enrollmentId && onOpenPaymentForEnrollment) {
        onOpenChange(false)
        setTimeout(() => onOpenPaymentForEnrollment(enrollmentId), 200)
      }
    } catch (error) {
      handleApiError(error, "Erro ao inscrever paciente")
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
  const enrolledPatientIds = new Set(enrollments.map(e => e.patient_id))
  const availablePatients = patients.filter(p => !enrolledPatientIds.has(p.id))
  const patientOptions: SelectOption[] = availablePatients.map(p => ({ value: p.id, label: p.name }))

  const hasSessionLimit = planTotalSessions != null && planTotalSessions > 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Alunos Inscritos
            </DialogTitle>
            <DialogDescription>
              {sessionPlanTitle} — {activeCount}{capacity ? `/${capacity}` : ""} vagas ocupadas
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Add patient section */}
            {!showAddForm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
                disabled={capacity != null && activeCount >= capacity}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {capacity != null && activeCount >= capacity ? "Turma lotada" : "Adicionar Paciente"}
              </Button>
            ) : (
              <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Novo Aluno</Label>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddForm(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Paciente</Label>
                  <ReactSelect
                    options={patientOptions}
                    value={patientOptions.find(o => o.value === selectedPatientId) || null}
                    onChange={(option) => setSelectedPatientId(option ? option.value : "")}
                    placeholder="Selecione um paciente..."
                    isClearable
                    isSearchable
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Total de sessões</Label>
                    <Input
                      type="number"
                      min={1}
                      max={hasSessionLimit ? planTotalSessions : undefined}
                      placeholder={hasSessionLimit ? `Máx: ${planTotalSessions}` : "Indeterminado"}
                      value={totalSessions}
                      onChange={e => {
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
                        ? `Limite do plano: ${planTotalSessions}. Deixe vazio para usar o limite do plano.`
                        : "Limite individual deste aluno. Deixe vazio para indeterminado."}
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
                      <Label className="text-xs">Valor mensal (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={monthlyAmount}
                        onChange={e => setMonthlyAmount(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dia de cobrança</Label>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={billingDay}
                        onChange={e => setBillingDay(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}

                <Button size="sm" onClick={handleEnroll} disabled={!selectedPatientId || enrolling} className="w-full">
                  {enrolling ? "Inscrevendo..." : "Inscrever Paciente"}
                </Button>
              </div>
            )}

            {/* Enrollments list */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhum aluno inscrito.</p>
            ) : (
              <div className="space-y-2">
                {enrollments.map(enrollment => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{enrollment.patient_name || "Paciente"}</span>
                        <Badge variant={statusVariants[enrollment.status]} className="text-[10px] px-1.5 py-0">
                          {statusLabels[enrollment.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{paymentModeLabels[enrollment.payment_mode]}</span>
                        <span>
                          {enrollment.sessions_done}/{enrollment.total_sessions != null ? enrollment.total_sessions : "∞"} sessões
                        </span>
                      </div>
                      {enrollment.total_sessions != null && enrollment.total_sessions > 0 && (
                        <Progress value={enrollment.progress} className="h-1 mt-1.5" />
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {enrollment.status === "active" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Suspender"
                            onClick={() => setConfirmAction({ type: "suspend", enrollmentId: enrollment.id, name: enrollment.patient_name || "" })}
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            title="Cancelar"
                            onClick={() => setConfirmAction({ type: "cancel", enrollmentId: enrollment.id, name: enrollment.patient_name || "" })}
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
                            onClick={() => setConfirmAction({ type: "reactivate", enrollmentId: enrollment.id, name: enrollment.patient_name || "" })}
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            title="Cancelar"
                            onClick={() => setConfirmAction({ type: "cancel", enrollmentId: enrollment.id, name: enrollment.patient_name || "" })}
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
          confirmAction?.type === "suspend" ? "Suspender Inscrição" :
          confirmAction?.type === "reactivate" ? "Reativar Inscrição" :
          "Cancelar Inscrição"
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
