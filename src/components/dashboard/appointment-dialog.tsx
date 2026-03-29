"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Loader2, Trash2, Wallet } from "lucide-react"
import type { MultiValue } from "react-select"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ReactSelect, SelectOption } from "@/components/ui/react-select"
import { CurrencyInput } from "@/components/ui/currency-input"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import type { Appointment, Patient, Professional, AppointmentPaymentStatus } from "@/types/api"
import { AppointmentPaymentModal } from "./appointment-payment-modal"

const appointmentSchema = z.object({
  patient_id: z.string().min(1, "Paciente e obrigatorio"),
  professional_id: z.string().min(1, "Profissional e obrigatorio"),
  start_time: z.string().min(1, "Data e hora sao obrigatorios"),
  duration_minutes: z.number().min(5, "Minimo 5 minutos").max(480, "Maximo 480 minutos"),
  title: z.string().optional(),
  notes: z.string().optional(),
  price: z.number().min(0).optional(),
  procedures: z.array(z.object({
    procedure_id: z.string(),
    price: z.number()
  })).optional(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface AppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: Appointment | null
  defaultStart?: Date
  defaultEnd?: Date
  defaultProfessionalId?: string
  professionals: Professional[]
  onSuccess: () => void
}

const statusLabels: Record<string, string> = {
  awaiting_payment: "Aguardando Pagamento",
  pending: "Pendente",
  confirmed: "Confirmado",
  canceled: "Cancelado",
  no_show: "Faltou",
  completed: "Concluido",
  rescheduled: "Reagendado",
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
  awaiting_payment: "warning",
  pending: "warning",
  confirmed: "success",
  canceled: "destructive",
  no_show: "secondary",
  completed: "info",
  rescheduled: "outline",
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  defaultStart,
  defaultEnd,
  defaultProfessionalId,
  professionals,
  onSuccess,
}: AppointmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  
  // Procedures
  const [procedures, setProcedures] = useState<any[]>([])
  const [proceduresLoading, setProceduresLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const isEditing = !!appointment

  const defaultDuration =
    defaultStart && defaultEnd
      ? Math.round((defaultEnd.getTime() - defaultStart.getTime()) / 60000)
      : 30

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: "",
      professional_id: defaultProfessionalId || "",
      start_time: defaultStart ? format(defaultStart, "yyyy-MM-dd'T'HH:mm") : "",
      duration_minutes: defaultDuration,
      title: "",
      notes: "",
      price: 0,
      procedures: [],
    },
  })

  // Fetch patients when dialog opens
  const fetchPatients = useCallback(async () => {
    setPatientsLoading(true)
    try {
      const response = await api.getPatients({ limit: 200 })
      setPatients(response.data || [])
    } catch (error) {
      console.error("Error fetching patients:", error)
    } finally {
      setPatientsLoading(false)
    }
  }, [])

  // Fetch procedures
  const fetchProcedures = useCallback(async () => {
    setProceduresLoading(true)
    try {
      const response = await api.getProcedures({ page: 1, limit: 100 })
      setProcedures(response.data || [])
    } catch (error) {
      console.error("Error fetching procedures:", error)
    } finally {
      setProceduresLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchPatients()
      fetchProcedures()
    }
  }, [open, fetchPatients, fetchProcedures])

  // Convert patients to select options
  const patientOptions: SelectOption[] = useMemo(() => {
    return patients.map((patient) => ({
      value: patient.id,
      label: patient.name,
    }))
  }, [patients])

  // Convert professionals to select options
  const professionalOptions: SelectOption[] = useMemo(() => {
    return professionals.map((prof) => ({
      value: prof.id,
      label: `${prof.name} - ${prof.specialty}`,
      color: prof.color,
    }))
  }, [professionals])

  const procedureOptions: SelectOption[] = useMemo(() => {
    return procedures.map((proc) => ({
      value: proc.id,
      label: `${proc.name} (R$ ${proc.price.toFixed(2)})`,
      basePrice: proc.price,
    }))
  }, [procedures])

  const watchedPatientId = watch("patient_id")
  const selectedPatientOption = useMemo(() => {
    if (!watchedPatientId) return null
    return patientOptions.find((opt) => opt.value === watchedPatientId) || null
  }, [watchedPatientId, patientOptions])

  const watchedProfessionalId = watch("professional_id")
  const selectedProfessionalOption = useMemo(() => {
    if (!watchedProfessionalId) return null
    return professionalOptions.find((opt) => opt.value === watchedProfessionalId) || null
  }, [watchedProfessionalId, professionalOptions])

  const watchedProcedures = watch("procedures") || []
  const selectedProcedureOptions = useMemo(() => {
    return watchedProcedures
      .map((p) => procedureOptions.find((opt) => opt.value === p.procedure_id))
      .filter(Boolean) as SelectOption[]
  }, [watchedProcedures, procedureOptions])

  useEffect(() => {
    if (appointment) {
      reset({
        patient_id: appointment.patient_id,
        professional_id: appointment.professional_id,
        start_time: format(new Date(appointment.start_time), "yyyy-MM-dd'T'HH:mm"),
        duration_minutes: Math.round(
          (new Date(appointment.end_time).getTime() -
            new Date(appointment.start_time).getTime()) /
            60000
        ),
        title: appointment.title,
        notes: appointment.notes,
        price: appointment.price,
        procedures: appointment.procedures ? appointment.procedures.map((p: any) => ({
           procedure_id: p.procedure_id,
           price: p.price
        })) : [],
      })
    } else {
      reset({
        patient_id: "",
        professional_id: defaultProfessionalId || "",
        start_time: defaultStart ? format(defaultStart, "yyyy-MM-dd'T'HH:mm") : "",
        duration_minutes: defaultDuration,
        title: "",
        notes: "",
        price: 0,
        procedures: [],
      })
    }
  }, [appointment, defaultStart, defaultEnd, defaultProfessionalId, reset, defaultDuration])

  const onSubmit = async (data: AppointmentFormData) => {
    setIsLoading(true)
    try {
      // Convert datetime-local format to ISO 8601
      const payload = {
        ...data,
        start_time: new Date(data.start_time).toISOString(),
      }

      if (isEditing) {
        await api.updateAppointment(appointment.id, payload)
        showToast.success("Agendamento atualizado com sucesso!")
      } else {
        await api.createAppointment(payload)
        showToast.success("Agendamento criado com sucesso!")
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      handleApiError(error, "Erro ao salvar agendamento")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusAction = async (action: string) => {
    if (!appointment) return

    const actionMessages: Record<string, string> = {
      confirm: "Agendamento confirmado!",
      cancel: "Agendamento cancelado!",
      complete: "Agendamento concluído!",
      no_show: "Paciente marcado como faltou",
    }

    setIsLoading(true)
    try {
      switch (action) {
        case "confirm":
          await api.confirmAppointment(appointment.id)
          break
        case "cancel":
          await api.cancelAppointment(appointment.id)
          break
        case "complete":
          await api.completeAppointment(appointment.id)
          break
        case "no_show":
          await api.markNoShow(appointment.id)
          break
      }
      showToast.success(actionMessages[action] || "Status atualizado!")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      handleApiError(error, "Erro ao atualizar status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!appointment || !confirm("Tem certeza que deseja excluir este agendamento?")) return

    setIsLoading(true)
    try {
      await api.deleteAppointment(appointment.id)
      showToast.success("Agendamento excluído com sucesso!")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      handleApiError(error, "Erro ao excluir agendamento")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
          {isEditing && appointment && (
            <DialogDescription className="flex items-center gap-2">
              Status:{" "}
              <Badge variant={statusVariants[appointment.status]}>
                {statusLabels[appointment.status]}
              </Badge>
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Patient Select */}
          <div className="space-y-2">
            <Label htmlFor="patient">
              Paciente <span className="text-destructive">*</span>
            </Label>
            <ReactSelect
              value={selectedPatientOption}
              onChange={(option) => setValue("patient_id", option?.value || "")}
              options={patientOptions}
              placeholder="Buscar paciente..."
              isDisabled={isLoading}
              isLoading={patientsLoading}
              isClearable
            />
            {errors.patient_id && (
              <p className="text-sm text-destructive">{errors.patient_id.message}</p>
            )}
          </div>

          {/* Professional */}
          <div className="space-y-2">
            <Label htmlFor="professional_id">
              Profissional <span className="text-destructive">*</span>
            </Label>
            <ReactSelect
              value={selectedProfessionalOption}
              onChange={(option) => setValue("professional_id", option?.value || "")}
              options={professionalOptions}
              placeholder="Buscar profissional..."
              isDisabled={isLoading}
              showColorIndicator
              isClearable
            />
            {errors.professional_id && (
              <p className="text-sm text-destructive">{errors.professional_id.message}</p>
            )}
          </div>

          {/* Date Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">
                Data e Hora <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start_time"
                type="datetime-local"
                {...register("start_time")}
                disabled={isLoading}
              />
              {errors.start_time && (
                <p className="text-sm text-destructive">{errors.start_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">
                Duracao (min) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="duration_minutes"
                type="number"
                min={5}
                max={480}
                step={5}
                {...register("duration_minutes", { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.duration_minutes && (
                <p className="text-sm text-destructive">{errors.duration_minutes.message}</p>
              )}
            </div>
          </div>

          {/* Title & Notes */}
          <div className="space-y-2">
            <Label htmlFor="title">Titulo (opcional)</Label>
            <Input
              id="title"
              placeholder="Ex: Consulta de retorno"
              {...register("title")}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observacoes (opcional)</Label>
            <Input
              id="notes"
              placeholder="Notas internas..."
              {...register("notes")}
              disabled={isLoading}
            />
          </div>

          {/* Procedures */}
          <div className="space-y-2">
            <Label>Procedimentos Opcionais</Label>
            <ReactSelect<true>
              isMulti
              value={selectedProcedureOptions}
              onChange={(options) => {
                const selected = (options as MultiValue<SelectOption>) || []
                
                // Keep the existing price if the procedure was already selected,
                // otherwise assign the basePrice.
                const newProcedures = selected.map((opt) => {
                  const existing = watchedProcedures.find(p => p.procedure_id === opt.value)
                  return {
                    procedure_id: opt.value,
                    price: existing !== undefined ? existing.price : (opt.basePrice || 0)
                  }
                })

                setValue("procedures", newProcedures, { shouldValidate: true })

                // Always calculate total from procedures safely wrapping in cents
                const calculatedTotalCents = newProcedures.reduce((sum, p) => sum + Math.round((p.price || 0) * 100), 0)
                setValue("price", calculatedTotalCents / 100, { shouldValidate: true })
              }}
              options={procedureOptions}
              placeholder="Selecione um ou mais..."
              isDisabled={isLoading}
              isLoading={proceduresLoading}
              isClearable
            />
            {watchedProcedures.length > 0 && (
              <div className="mt-2 space-y-2 rounded-md border p-3 bg-slate-50">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Valores na Sessão
                </Label>
                {watchedProcedures.map((proc, index) => {
                  const label = procedureOptions.find(o => o.value === proc.procedure_id)?.label || "Procedimento"
                  /* Strip off the price suffix from label */
                  const cleanLabel = label.replace(/\(R\$.+\)$/, '').trim()
                  
                  return (
                    <div key={proc.procedure_id} className="flex items-center gap-3">
                      <span className="flex-1 text-sm font-medium leading-none">{cleanLabel}</span>
                      <div className="w-32">
                        <Controller
                          name={`procedures.${index}.price`}
                          control={control}
                          render={({ field }) => (
                            <CurrencyInput
                              autoFocus={false}
                              value={field.value}
                              onChange={(val) => {
                                field.onChange(val)
                                const proceduresCopy = [...watchedProcedures]
                                proceduresCopy[index].price = val
                                // Calculo seguro em centavos
                                const sumCents = proceduresCopy.reduce((acc, p) => acc + Math.round((p.price || 0) * 100), 0)
                                setValue("price", sumCents / 100, { shouldValidate: true })
                              }}
                              disabled={isLoading}
                            />
                          )}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Valor Total (Soma dos Procedimentos)</Label>
            <div className="flex items-center gap-3">
              <CurrencyInput
                id="price"
                value={watch("price")}
                onChange={() => {}}
                disabled={true}
              />
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Pagamentos
                  {appointment?.payment_status === "paid" && (
                    <Badge className="ml-2 text-[10px] bg-green-600">Pago</Badge>
                  )}
                  {appointment?.payment_status === "partial" && (
                    <Badge className="ml-2 text-[10px] bg-amber-500">Parcial</Badge>
                  )}
                </Button>
              )}
            </div>
          </div>

          {isEditing && appointment && (
            <AppointmentPaymentModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              appointmentId={appointment.id}
              appointmentPrice={watch("price") || 0}
              onPaymentChanged={onSuccess}
            />
          )}

          <DialogFooter className="gap-2">
            {isEditing && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <div className="flex-1" />

                {appointment?.status === "pending" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleStatusAction("confirm")}
                    disabled={isLoading}
                  >
                    Confirmar
                  </Button>
                )}

                {appointment?.status === "confirmed" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleStatusAction("complete")}
                      disabled={isLoading}
                    >
                      Concluir
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleStatusAction("no_show")}
                      disabled={isLoading}
                    >
                      Faltou
                    </Button>
                  </>
                )}

                {(appointment?.status === "pending" ||
                  appointment?.status === "confirmed") && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleStatusAction("cancel")}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                )}
              </>
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
