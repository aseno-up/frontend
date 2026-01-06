"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, Play, Pause, X, Calendar, Clock, User, Briefcase, RefreshCw } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea"
import { CurrencyInput } from "@/components/ui/currency-input"
import { ReactSelect, SelectOption } from "@/components/ui/react-select"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import { SessionPlan, Professional, Patient, PlanStatus, Frequency } from "@/types/api"

// Schema de validacao com Zod
const sessionPlanSchema = z.object({
  patient_id: z.string().min(1, "Paciente e obrigatorio"),
  professional_id: z.string().min(1, "Profissional e obrigatorio"),
  title: z.string().min(1, "Titulo e obrigatorio"),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "biweekly", "triweekly", "bimonthly", "monthly", "custom"]),
  preferred_time: z.string().min(1, "Horario e obrigatorio"),
  duration_mins: z.number().min(15, "Minimo 15 minutos").max(480, "Maximo 480 minutos"),
  total_sessions: z.number().min(1, "Minimo 1 sessao").max(200, "Maximo 200 sessoes"),
  start_date: z.string().min(1, "Data de inicio e obrigatoria"),
  session_price: z.number().min(0, "Valor nao pode ser negativo").optional(),
  notes: z.string().optional(),
})

type SessionPlanFormData = z.infer<typeof sessionPlanSchema>

interface PlanosSessaoPageProps {
  params: Promise<{ lng: string }>
}

const statusLabels: Record<PlanStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluido",
  cancelled: "Cancelado",
}

const statusVariants: Record<PlanStatus, "default" | "secondary" | "destructive" | "success" | "warning"> = {
  active: "success",
  paused: "warning",
  completed: "secondary",
  cancelled: "destructive",
}

const frequencyLabels: Record<Frequency, string> = {
  daily: "Diario",
  weekly: "1x por semana",
  biweekly: "2x por semana",
  triweekly: "3x por semana",
  bimonthly: "Quinzenal",
  monthly: "Mensal",
  custom: "Personalizado",
}

export default function PlanosSessaoPage({ params }: PlanosSessaoPageProps) {
  const [lng, setLng] = useState("pt-BR")
  const [plans, setPlans] = useState<SessionPlan[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SessionPlanFormData>({
    resolver: zodResolver(sessionPlanSchema),
    defaultValues: {
      patient_id: "",
      professional_id: "",
      title: "",
      description: "",
      frequency: "biweekly",
      preferred_time: "09:00",
      duration_mins: 50,
      total_sessions: 10,
      start_date: new Date().toISOString().split("T")[0],
      session_price: 0,
      notes: "",
    },
  })

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  // Convert patients and professionals to select options
  const patientOptions: SelectOption[] = useMemo(() => {
    return patients.map((patient) => ({
      value: patient.id,
      label: patient.name,
    }))
  }, [patients])

  const professionalOptions: SelectOption[] = useMemo(() => {
    return professionals.map((prof) => ({
      value: prof.id,
      label: `${prof.name} - ${prof.specialty}`,
      color: prof.color,
    }))
  }, [professionals])

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

  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true)
      const status = statusFilter === "all" ? undefined : statusFilter
      const data = await api.getSessionPlans(1, 50, status)
      setPlans(data.data || [])
    } catch (err) {
      handleApiError(err, "Erro ao carregar planos")
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  const fetchProfessionals = useCallback(async () => {
    try {
      const data = await api.getProfessionals(1, 100)
      setProfessionals(data.data || [])
    } catch (err) {
      handleApiError(err, "Erro ao carregar profissionais")
    }
  }, [])

  const fetchPatients = useCallback(async () => {
    try {
      const data = await api.getPatients(1, 100)
      setPatients(data.data || [])
    } catch (err) {
      handleApiError(err, "Erro ao carregar pacientes")
    }
  }, [])

  useEffect(() => {
    fetchPlans()
    fetchProfessionals()
    fetchPatients()
  }, [fetchPlans, fetchProfessionals, fetchPatients])

  const onSubmit = async (data: SessionPlanFormData) => {
    try {
      setIsSubmitting(true)
      await api.createSessionPlan(data)
      showToast.success("Plano criado com sucesso!")
      setIsDialogOpen(false)
      reset()
      fetchPlans()
    } catch (err) {
      handleApiError(err, "Erro ao criar plano")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePause = async (id: string) => {
    try {
      await api.pauseSessionPlan(id)
      showToast.success("Plano pausado!")
      fetchPlans()
    } catch (err) {
      handleApiError(err, "Erro ao pausar plano")
    }
  }

  const handleResume = async (id: string) => {
    try {
      await api.resumeSessionPlan(id)
      showToast.success("Plano retomado!")
      fetchPlans()
    } catch (err) {
      handleApiError(err, "Erro ao retomar plano")
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar este plano?")) return
    try {
      await api.cancelSessionPlan(id)
      showToast.success("Plano cancelado!")
      fetchPlans()
    } catch (err) {
      handleApiError(err, "Erro ao cancelar plano")
    }
  }

  const handleGenerate = async (id: string) => {
    try {
      const result = await api.generateSessionPlanAppointments(id, 2)
      showToast.success(`${result.appointments_created} agendamentos criados!`)
      fetchPlans()
    } catch (err) {
      handleApiError(err, "Erro ao gerar agendamentos")
    }
  }

  const handleOpenDialog = () => {
    reset({
      patient_id: "",
      professional_id: "",
      title: "",
      description: "",
      frequency: "biweekly",
      preferred_time: "09:00",
      duration_mins: 50,
      total_sessions: 10,
      start_date: new Date().toISOString().split("T")[0],
      session_price: 0,
      notes: "",
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Planos de Sessao" />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Actions bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="paused">Pausados</SelectItem>
                  <SelectItem value="completed">Concluidos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleOpenDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Button>
          </div>

          {/* Plans list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : plans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">Nenhum plano encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Crie um plano de sessao para gerar agendamentos automaticamente
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.title}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                      <Badge variant={statusVariants[plan.status]}>
                        {statusLabels[plan.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{plan.patient_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{plan.professional_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {frequencyLabels[plan.frequency]} - {plan.preferred_time}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>
                          {plan.sessions_done}/{plan.total_sessions} sessoes
                        </span>
                      </div>
                      <Progress value={plan.progress} className="h-2" />
                    </div>

                    {plan.status === "active" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handlePause(plan.id)}
                        >
                          <Pause className="mr-1 h-3 w-3" />
                          Pausar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerate(plan.id)}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(plan.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {plan.status === "paused" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleResume(plan.id)}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Retomar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(plan.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Plan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Plano de Sessao</DialogTitle>
            <DialogDescription>
              Crie um plano para gerar agendamentos automaticamente
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Titulo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Ex: Fisioterapia - Joao Silva"
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="patient">
                    Paciente <span className="text-destructive">*</span>
                  </Label>
                  <ReactSelect
                    value={selectedPatientOption}
                    onChange={(option) => setValue("patient_id", option?.value || "")}
                    options={patientOptions}
                    placeholder="Buscar paciente..."
                    isClearable
                  />
                  {errors.patient_id && (
                    <p className="text-sm text-destructive">{errors.patient_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professional">
                    Profissional <span className="text-destructive">*</span>
                  </Label>
                  <ReactSelect
                    value={selectedProfessionalOption}
                    onChange={(option) => setValue("professional_id", option?.value || "")}
                    options={professionalOptions}
                    placeholder="Buscar profissional..."
                    showColorIndicator
                    isClearable
                  />
                  {errors.professional_id && (
                    <p className="text-sm text-destructive">{errors.professional_id.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="frequency">
                    Frequencia <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="frequency"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">1x por semana</SelectItem>
                          <SelectItem value="biweekly">2x por semana</SelectItem>
                          <SelectItem value="triweekly">3x por semana</SelectItem>
                          <SelectItem value="bimonthly">Quinzenal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_time">
                    Horario Preferido <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="preferred_time"
                    type="time"
                    {...register("preferred_time")}
                    className={errors.preferred_time ? "border-destructive" : ""}
                  />
                  {errors.preferred_time && (
                    <p className="text-sm text-destructive">{errors.preferred_time.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    Duracao (min) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min={15}
                    max={480}
                    {...register("duration_mins", { valueAsNumber: true })}
                    className={errors.duration_mins ? "border-destructive" : ""}
                  />
                  {errors.duration_mins && (
                    <p className="text-sm text-destructive">{errors.duration_mins.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_sessions">
                    Total Sessoes <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="total_sessions"
                    type="number"
                    min={1}
                    max={200}
                    {...register("total_sessions", { valueAsNumber: true })}
                    className={errors.total_sessions ? "border-destructive" : ""}
                  />
                  {errors.total_sessions && (
                    <p className="text-sm text-destructive">{errors.total_sessions.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session_price">Valor</Label>
                  <Controller
                    name="session_price"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        id="session_price"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">
                  Data de Inicio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                  className={errors.start_date ? "border-destructive" : ""}
                />
                {errors.start_date && (
                  <p className="text-sm text-destructive">{errors.start_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observacoes</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Observacoes sobre o plano..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Plano"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
