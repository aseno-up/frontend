"use client"

import { useCallback, useEffect, useState } from "react"
import { ClipboardCheck, UserPlus, Check, X, Minus, Search, CreditCard } from "lucide-react"

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
import { Enrollment, AttendanceRecord, AttendanceStatus, Patient } from "@/types/api"

interface GroupAttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  sessionPlanId: string
}

interface AttendanceEntry {
  patientId: string
  patientName: string
  status: AttendanceStatus
  isGuest: boolean
  existing: boolean // true if already recorded in DB
  paymentMethodId?: string
  paymentAmount?: number
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

export function GroupAttendanceDialog({ open, onOpenChange, appointmentId, sessionPlanId }: GroupAttendanceDialogProps) {
  const [entries, setEntries] = useState<AttendanceEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Guest add state
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [guestSearch, setGuestSearch] = useState("")
  const [allPatients, setAllPatients] = useState<Patient[]>([])

  // Payment methods for guest payment
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  const loadData = useCallback(async () => {
    if (!appointmentId || !sessionPlanId) return
    setLoading(true)
    try {
      const [enrollmentsResp, attendanceResp] = await Promise.all([
        api.getEnrollments(sessionPlanId),
        api.getAttendance(appointmentId),
      ])

      const enrollments: Enrollment[] = enrollmentsResp.data || enrollmentsResp || []
      const attendanceRecords: AttendanceRecord[] = attendanceResp.data || attendanceResp || []

      const attendanceMap = new Map<string, AttendanceRecord>()
      attendanceRecords.forEach(r => attendanceMap.set(r.patient_id, r))

      const newEntries: AttendanceEntry[] = []

      // Add all active enrollments
      enrollments
        .filter(e => e.status === "active")
        .forEach(e => {
          const existing = attendanceMap.get(e.patient_id)
          newEntries.push({
            patientId: e.patient_id,
            patientName: e.patient_name || "Paciente",
            status: existing?.status || "present",
            isGuest: false,
            existing: !!existing,
          })
          attendanceMap.delete(e.patient_id)
        })

      // Add guest records (patients not in enrollment but with attendance)
      attendanceMap.forEach(record => {
        if (record.is_guest) {
          newEntries.push({
            patientId: record.patient_id,
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
  }, [appointmentId, sessionPlanId])

  useEffect(() => {
    if (open) {
      loadData()
      // Load payment methods for guest payments
      api.getPaymentMethods().then((data: { data?: PaymentMethod[] }) => {
        setPaymentMethods(data.data || [])
      }).catch(() => {})
    }
  }, [open, loadData])

  const setStatus = (patientId: string, status: AttendanceStatus) => {
    setEntries(prev => prev.map(e => e.patientId === patientId ? { ...e, status } : e))
  }

  const markAllPresent = () => {
    setEntries(prev => prev.map(e => ({ ...e, status: "present" as AttendanceStatus })))
  }

  const updateGuestPayment = (patientId: string, field: 'paymentMethodId' | 'paymentAmount', value: string | number) => {
    setEntries(prev => prev.map(e => {
      if (e.patientId !== patientId) return e
      return { ...e, [field]: value }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all(
        entries.map(entry => {
          const data: {
            patient_id: string
            status: AttendanceStatus
            is_guest: boolean
            payment_method_id?: string
            payment_amount?: number
          } = {
            patient_id: entry.patientId,
            status: entry.status,
            is_guest: entry.isGuest,
          }

          // Include payment info for present guests with payment data
          if (entry.isGuest && entry.status === "present" && entry.paymentMethodId && entry.paymentAmount && entry.paymentAmount > 0) {
            data.payment_method_id = entry.paymentMethodId
            data.payment_amount = entry.paymentAmount
          }

          return api.recordAttendance(appointmentId, data)
        })
      )
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

  const hasNewGuests = entries.some(e => e.isGuest && !e.existing && e.status === "present")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Registro de Presença
          </DialogTitle>
          <DialogDescription>
            Marque a presença dos alunos nesta sessão
          </DialogDescription>
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
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {(["present", "absent", "substituted"] as AttendanceStatus[]).map(s => (
                          <button
                            key={s}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                              entry.status === s ? statusConfig[s].color : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                            onClick={() => setStatus(entry.patientId, s)}
                          >
                            {statusConfig[s].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Guest payment fields — shown for new guests marked as present */}
                    {entry.isGuest && !entry.existing && entry.status === "present" && paymentMethods.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 border-t">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <Select
                          value={entry.paymentMethodId || ""}
                          onValueChange={(v) => updateGuestPayment(entry.patientId, 'paymentMethodId', v)}
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
                          onChange={(e) => updateGuestPayment(entry.patientId, 'paymentAmount', parseFloat(e.target.value) || 0)}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || entries.length === 0}>
            {saving ? "Salvando..." : hasNewGuests ? "Salvar Presença e Pagamento" : "Salvar Presença"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
