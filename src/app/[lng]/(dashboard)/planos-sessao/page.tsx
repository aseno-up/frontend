"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, Play, Pause, X, Calendar, Clock, User, Briefcase, RefreshCw, Check, ArrowRight, ArrowLeft } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import { SessionPlan, Professional, Patient, PlanStatus, Frequency } from "@/types/api"

// Schema Validation
const sessionPlanSchema = z.object({
  patient_id: z.string().min(1, "Paciente é obrigatório"),
  professional_id: z.string().optional(),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "biweekly", "triweekly", "bimonthly", "monthly", "custom"]),
  preferred_time: z.string().min(1, "Horário é obrigatório"),
  duration_mins: z.number().min(15, "Mínimo 15 minutos").max(480, "Máximo 480 minutos"),
  total_sessions: z.number().min(-1, "Inválido").max(200, "Máximo 200 sessões"),
  is_indeterminate: z.boolean().default(false),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  session_price: z.number().min(0, "Valor não pode ser negativo").optional(),
  notes: z.string().optional(),
  
  // Wizard specific fields
  professional_mode: z.enum(["fixed", "flexible"]).default("fixed"),
  generation_mode: z.enum(["auto", "manual"]).default("auto"),
  generate_all: z.boolean().default(false),
  whatsapp_confirmation: z.boolean().default(true),
}).refine((data) => {
  if (data.professional_mode === "fixed" && !data.professional_id) {
    return false
  }
  return true
}, {
  message: "Profissional é obrigatório para modo fixo",
  path: ["professional_id"],
})

type SessionPlanFormData = z.infer<typeof sessionPlanSchema>

interface PlanosSessaoPageProps {
  params: Promise<{ lng: string }>
}

const statusLabels: Record<PlanStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
  cancelled: "Cancelado",
}

const statusVariants: Record<PlanStatus, "default" | "secondary" | "destructive" | "success" | "warning"> = {
  active: "success",
  paused: "warning",
  completed: "secondary",
  cancelled: "destructive",
}

const frequencyLabels: Record<Frequency, string> = {
  daily: "Diário",
  weekly: "1x por semana",
  biweekly: "2x por semana",
  triweekly: "3x por semana",
  bimonthly: "Quinzenal",
  monthly: "Mensal",
  custom: "Personalizado",
}

const steps = [
  { id: 1, title: "Paciente" },
  { id: 2, title: "Pacote" },
  { id: 3, title: "Profissional" },
  { id: 4, title: "Geração" },
  { id: 5, title: "Revisão" },
]

export default function PlanosSessaoPage({ params }: PlanosSessaoPageProps) {
  const [lng, setLng] = useState("pt-BR")
  const [plans, setPlans] = useState<SessionPlan[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Wizard State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
    trigger,
    getValues,
  } = useForm<SessionPlanFormData>({
    resolver: zodResolver(sessionPlanSchema),
    defaultValues: {
      patient_id: "",
      professional_id: "",
      title: "",
      description: "",
      frequency: "weekly",
      preferred_time: "09:00",
      duration_mins: 50,
      total_sessions: 10,
      is_indeterminate: false,
      start_date: new Date().toISOString().split("T")[0],
      session_price: 0,
      notes: "",
      professional_mode: "fixed",
      generation_mode: "auto",
      generate_all: false,
      whatsapp_confirmation: true,
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

  // Watch fields for logic
  const watchedPatientId = watch("patient_id")
  const watchedProfessionalId = watch("professional_id")
  const watchedIsIndeterminate = watch("is_indeterminate")
  const watchedProfessionalMode = watch("professional_mode")
  const watchedTotalSessions = watch("total_sessions")
  const watchedStartDate = watch("start_date")
  const watchedPreferredTime = watch("preferred_time")
  const watchedFrequency = watch("frequency")
  
  const selectedPatientOption = useMemo(() => {
    if (!watchedPatientId) return null
    return patientOptions.find((opt) => opt.value === watchedPatientId) || null
  }, [watchedPatientId, patientOptions])

  const selectedProfessionalOption = useMemo(() => {
    if (!watchedProfessionalId) return null
    return professionalOptions.find((opt) => opt.value === watchedProfessionalId) || null
  }, [watchedProfessionalId, professionalOptions])

  // Fetch Data
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

  // Form Logic
  const handleNext = async () => {
    let fieldsToValidate: (keyof SessionPlanFormData)[] = []
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["patient_id"]
        break
      case 2:
        fieldsToValidate = ["title", "frequency", "preferred_time", "duration_mins", "start_date", "total_sessions"]
        break
      case 3:
        fieldsToValidate = ["professional_mode"]
        if (watchedProfessionalMode === "fixed") {
          fieldsToValidate.push("professional_id")
        }
        break
      case 4:
        fieldsToValidate = ["generation_mode"]
        break
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const onSubmit = async (data: SessionPlanFormData) => {
    try {
      setIsSubmitting(true)
      
      const payload = {
        patient_id: data.patient_id,
        professional_id: data.professional_mode === "fixed" ? data.professional_id : undefined,
        title: data.title,
        description: data.description,
        frequency: data.frequency,
        preferred_time: data.preferred_time,
        duration_mins: data.duration_mins,
        total_sessions: data.is_indeterminate ? -1 : data.total_sessions,
        start_date: data.start_date,
        session_price: data.session_price,
        notes: data.notes,
        generate_all: data.generate_all,
      }

      await api.createSessionPlan(payload)
      showToast.success("Plano criado com sucesso!")
      setIsDialogOpen(false)
      reset()
      setCurrentStep(1)
      fetchPlans()
    } catch (err) {
      handleApiError(err, "Erro ao criar plano")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDialog = () => {
    reset({
      patient_id: "",
      professional_id: "",
      title: "",
      description: "",
      frequency: "weekly",
      preferred_time: "09:00",
      duration_mins: 50,
      total_sessions: 10,
      is_indeterminate: false,
      start_date: new Date().toISOString().split("T")[0],
      session_price: 0,
      notes: "",
      professional_mode: "fixed",
      generation_mode: "auto",
      generate_all: false,
      whatsapp_confirmation: true,
    })
    setCurrentStep(1)
    setIsDialogOpen(true)
  }

  // Plan actions
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

  // Render Wizard Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Patient
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patient">
                Selecione o Paciente <span className="text-destructive">*</span>
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
            
            {/* Quick Create Patient (Placeholder for now) */}
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Não encontrou? <Button variant="link" className="h-auto p-0">Cadastrar novo paciente</Button>
            </div>
          </div>
        )

      case 2: // Package
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nome do Pacote <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Ex: Fisio - 10 sessões"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="total_sessions">Qtd. Sessões <span className="text-destructive">*</span></Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="is_indeterminate" 
                      checked={watchedIsIndeterminate}
                      onCheckedChange={(checked) => setValue("is_indeterminate", checked)}
                    />
                    <Label htmlFor="is_indeterminate" className="text-xs font-normal">Indeterminado</Label>
                  </div>
                </div>
                
                <Input
                  id="total_sessions"
                  type="number"
                  disabled={watchedIsIndeterminate}
                  {...register("total_sessions", { valueAsNumber: true })}
                  className={errors.total_sessions ? "border-destructive" : ""}
                  placeholder={watchedIsIndeterminate ? "∞" : "10"}
                />
                {errors.total_sessions && <p className="text-sm text-destructive">{errors.total_sessions.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência <span className="text-destructive">*</span></Label>
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
                        {/* <SelectItem value="custom">Personalizado</SelectItem> */}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Início <span className="text-destructive">*</span></Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                  className={errors.start_date ? "border-destructive" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_time">Horário <span className="text-destructive">*</span></Label>
                <Input
                  id="preferred_time"
                  type="time"
                  {...register("preferred_time")}
                  className={errors.preferred_time ? "border-destructive" : ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  {...register("duration_mins", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_price">Valor por Sessão</Label>
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
          </div>
        )

      case 3: // Professional
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Responsável pelo Pacote</Label>
              <RadioGroup
                value={watchedProfessionalMode}
                onValueChange={(val) => setValue("professional_mode", val as "fixed" | "flexible")}
                className="grid gap-4 sm:grid-cols-2"
              >
                <div>
                  <RadioGroupItem value="fixed" id="fixed" className="peer sr-only" />
                  <Label
                    htmlFor="fixed"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <User className="mb-3 h-6 w-6" />
                    <span className="font-semibold">Profissional Fixo</span>
                    <span className="text-center text-xs text-muted-foreground mt-1">
                      Sessões vinculadas a um profissional específico
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="flexible" id="flexible" className="peer sr-only" />
                  <Label
                    htmlFor="flexible"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Briefcase className="mb-3 h-6 w-6" />
                    <span className="font-semibold">Qualquer Profissional</span>
                    <span className="text-center text-xs text-muted-foreground mt-1">
                      Definido sessão a sessão (Agenda flexível)
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {watchedProfessionalMode === "fixed" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="professional">
                  Selecione o Profissional <span className="text-destructive">*</span>
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
            )}
          </div>
        )

      case 4: // Generation
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Geração de Sessões</Label>
              
              {watchedIsIndeterminate || watchedProfessionalMode === "flexible" ? (
                <div className="rounded-md bg-muted p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Geração Automática Limitada</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {watchedIsIndeterminate 
                      ? "Como a quantidade de sessões é indeterminada, o sistema gerará sessões para as próximas 2 semanas automaticamente." 
                      : "Para pacotes com profissional flexível, as sessões devem ser agendadas manualmente para garantir a disponibilidade."}
                  </p>
                </div>
              ) : (
                <RadioGroup
                  value={watchedTotalSessions > 0 ? (getValues("generate_all") ? "all" : "auto") : "auto"}
                  onValueChange={(val) => setValue("generate_all", val === "all")}
                  className="grid gap-4"
                >
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <RadioGroupItem value="all" id="gen-all" />
                    <div className="space-y-1">
                      <Label htmlFor="gen-all" className="font-medium">
                        Gerar todas as {watchedTotalSessions} sessões agora
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Reserva todos os horários na agenda do profissional.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <RadioGroupItem value="auto" id="gen-auto" />
                    <div className="space-y-1">
                      <Label htmlFor="gen-auto" className="font-medium">
                        Gerar aos poucos (Automático)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        O sistema mantém a agenda preenchida para as próximas 2 semanas.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label>Comunicação</Label>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Confirmação via WhatsApp</Label>
                  <DialogDescription>
                    Enviar lembretes e solicitar confirmação automática
                  </DialogDescription>
                </div>
                <Switch
                  checked={watch("whatsapp_confirmation")}
                  onCheckedChange={(checked) => setValue("whatsapp_confirmation", checked)}
                />
              </div>
            </div>
          </div>
        )

      case 5: // Review
        return (
          <div className="space-y-6 py-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Paciente</span>
                    <span className="font-medium">{selectedPatientOption?.label}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Profissional</span>
                    <span className="font-medium">
                      {watchedProfessionalMode === "fixed" ? selectedProfessionalOption?.label : "Qualquer (Flexível)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Pacote</span>
                    <span className="font-medium">{watch("title")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Sessões</span>
                    <span className="font-medium">
                      {watchedIsIndeterminate ? "Indeterminado (Contínuo)" : `${watchedTotalSessions} sessões`}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Frequência</span>
                    <span className="font-medium">
                      {frequencyLabels[watchedFrequency as Frequency]} às {watchedPreferredTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Início</span>
                    <span className="font-medium">
                      {format(new Date(watchedStartDate), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-200">
              <p className="font-semibold mb-1">Resumo da Ação</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>O plano será criado imediatamente.</li>
                {watchedProfessionalMode === "flexible" ? (
                  <li>As sessões <strong>não serão geradas</strong> automaticamente (requer agendamento manual).</li>
                ) : getValues("generate_all") && !watchedIsIndeterminate ? (
                  <li>Serão gerados <strong>{watchedTotalSessions} agendamentos</strong> na agenda.</li>
                ) : (
                  <li>O sistema gerará agendamentos para as <strong>próximas 2 semanas</strong>.</li>
                )}
                {watch("whatsapp_confirmation") && (
                  <li>O paciente receberá confirmações via WhatsApp antes de cada sessão.</li>
                )}
              </ul>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Planos de Sessão" />

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
                  <SelectItem value="completed">Concluídos</SelectItem>
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
                  Crie um plano de sessão para gerar agendamentos automaticamente
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
                        <span>{plan.professional_name || "Qualquer (Flexível)"}</span>
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
                          {plan.sessions_done}/{plan.total_sessions === -1 ? "∞" : plan.total_sessions} sessões
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
                          disabled={!plan.professional_id} // Disable if no professional (flexible)
                          title={!plan.professional_id ? "Requer agendamento manual" : "Gerar próximas sessões"}
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

      {/* Create Plan Dialog (Wizard) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo Plano de Sessão</DialogTitle>
            <DialogDescription>
              Configure o pacote de sessões em 5 passos simples
            </DialogDescription>
          </DialogHeader>

          {/* Stepper */}
          <div className="relative flex items-center justify-between px-2 py-4">
            <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted" />
            {steps.map((step) => {
              const isActive = step.id === currentStep
              const isCompleted = step.id < currentStep
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-1 bg-background px-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                      isActive && "border-primary bg-primary text-primary-foreground",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      !isActive && !isCompleted && "border-muted-foreground bg-background text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs">{step.id}</span>}
                  </div>
                  <span className={cn("text-[10px] font-medium uppercase", isActive ? "text-primary" : "text-muted-foreground")}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="min-h-[300px]">
              {renderStepContent()}
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? () => setIsDialogOpen(false) : handleBack}
              >
                {currentStep === 1 ? "Cancelar" : <><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</>}
              </Button>
              
              {currentStep < 5 ? (
                <Button type="button" onClick={handleNext}>
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Criando..." : "Criar Plano"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}