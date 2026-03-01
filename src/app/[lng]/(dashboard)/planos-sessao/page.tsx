"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, Play, Pause, X, Calendar, Clock, User, Briefcase, RefreshCw, Check, ArrowRight, ArrowLeft, Search, Activity } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Card, CardContent } from "@/components/ui/card"
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

// Schema
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
  whatsapp_confirmation: z.boolean().optional().default(true),
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
  weekly: "1x p/sem.",
  biweekly: "2x p/sem.",
  triweekly: "3x p/sem.",
  bimonthly: "Quinzenal",
  monthly: "Mensal",
  custom: "Custom.",
}

const steps = [
  { id: 1, title: "Paciente" },
  { id: 2, title: "Pacote" },
  { id: 3, title: "Profissional" },
  { id: 4, title: "Geração" },
  { id: 5, title: "Revisão" },
]

export default function PlanosSessaoPage({ params }: PlanosSessaoPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [lng, setLng] = useState("pt-BR")
  const [plans, setPlans] = useState<SessionPlan[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  
  // Meta and Pagination
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Dashboard mock metrics
  const [activeCount, setActiveCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  
  // URL Params read
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "10", 10)
  const search = searchParams.get("search") || ""
  const statusParam = searchParams.get("status") || "all"
  const sortBy = searchParams.get("sort_by") || "created_desc"

  const [searchInput, setSearchInput] = useState(search)

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
    resolver: zodResolver(sessionPlanSchema) as any,
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

  const updateQueryParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    if (!updates.page) params.set("page", "1")
    router.push(pathname + "?" + params.toString(), { scroll: false })
  }, [searchParams, pathname, router])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== search) {
        updateQueryParams({ search: searchInput })
      }
    }, 500)
    return () => clearTimeout(handler)
  }, [searchInput, search, updateQueryParams])

  const patientOptions: SelectOption[] = useMemo(() => {
    return patients.map((patient) => ({ value: patient.id, label: patient.name }))
  }, [patients])

  const professionalOptions: SelectOption[] = useMemo(() => {
    return professionals.map((prof) => ({ value: prof.id, label: `${prof.name} - ${prof.specialty}`, color: prof.color }))
  }, [professionals])

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

  const fetchPlans = useCallback(async () => {
    setIsLoading(true)
    try {
      const resp: any = await api.getSessionPlans({
        page,
        limit,
        search: search || undefined,
        status: statusParam !== "all" ? statusParam : undefined,
        sort_by: sortBy
      })
      setPlans(resp.data || [])
      setTotal(resp.meta?.total || 0)
      setTotalPages(resp.meta?.total_pages || 1)
      
      const activeList = (resp.data || []).filter((p: any) => p.status === 'active')
      const completedList = (resp.data || []).filter((p: any) => p.status === 'completed')
      
      setActiveCount(activeList.length)
      setCompletedCount(completedList.length)
    } catch (err) {
      handleApiError(err, "Erro ao carregar planos")
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search, statusParam, sortBy])

  const fetchProfessionals = useCallback(async () => {
    try {
      const data = await api.getProfessionals({ page: 1, limit: 100 })
      setProfessionals(data.data || [])
    } catch {}
  }, [])

  const fetchPatients = useCallback(async () => {
    try {
      const data = await api.getPatients({ limit: 100 })
      setPatients(data.data || [])
    } catch {}
  }, [])

  useEffect(() => {
    fetchPlans()
    fetchProfessionals()
    fetchPatients()
  }, [fetchPlans, fetchProfessionals, fetchPatients])

  const handleNext = async () => {
    let fieldsToValidate: (keyof SessionPlanFormData)[] = []
    switch (currentStep) {
      case 1: fieldsToValidate = ["patient_id"]; break
      case 2: fieldsToValidate = ["title", "frequency", "preferred_time", "duration_mins", "start_date", "total_sessions"]; break
      case 3:
        fieldsToValidate = ["professional_mode"]
        if (watchedProfessionalMode === "fixed") fieldsToValidate.push("professional_id")
        break
      case 4: fieldsToValidate = ["generation_mode"]; break
    }
    const isValid = await trigger(fieldsToValidate)
    if (isValid) setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => setCurrentStep((prev) => prev - 1)

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
      patient_id: "", professional_id: "", title: "", description: "",
      frequency: "weekly", preferred_time: "09:00", duration_mins: 50,
      total_sessions: 10, is_indeterminate: false, start_date: new Date().toISOString().split("T")[0],
      session_price: 0, notes: "", professional_mode: "fixed", generation_mode: "auto",
      generate_all: false, whatsapp_confirmation: true,
    })
    setCurrentStep(1)
    setIsDialogOpen(true)
  }

  const handlePause = async (id: string) => {
    try { await api.pauseSessionPlan(id); showToast.success("Plano pausado!"); fetchPlans() } 
    catch (err) { handleApiError(err, "Erro ao pausar plano") }
  }

  const handleResume = async (id: string) => {
    try { await api.resumeSessionPlan(id); showToast.success("Plano retomado!"); fetchPlans() } 
    catch (err) { handleApiError(err, "Erro ao retomar plano") }
  }

  const handleCancel = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar este plano?")) return
    try { await api.cancelSessionPlan(id); showToast.success("Plano cancelado!"); fetchPlans() } 
    catch (err) { handleApiError(err, "Erro ao cancelar plano") }
  }

  const handleGenerate = async (id: string) => {
    try {
      const result = await api.generateSessionPlanAppointments(id, 2)
      showToast.success(`${result.appointments_created} agendamentos criados!`)
      fetchPlans()
    } catch (err) { handleApiError(err, "Erro ao gerar agendamentos") }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Patient
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Selecione o Paciente <span className="text-destructive">*</span></Label>
              <ReactSelect
                value={selectedPatientOption}
                onChange={(option) => setValue("patient_id", option?.value || "")}
                options={patientOptions}
                placeholder="Buscar paciente..."
                isClearable
              />
              {errors.patient_id && <p className="text-sm text-destructive">{errors.patient_id.message}</p>}
            </div>
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
              <Input id="title" {...register("title")} placeholder="Ex: Fisio - 10 sessões" className={errors.title ? "border-destructive" : ""} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="total_sessions">Qtd. Sessões <span className="text-destructive">*</span></Label>
                  <div className="flex items-center gap-2">
                    <Switch id="is_indeterminate" checked={watchedIsIndeterminate} onCheckedChange={(checked) => setValue("is_indeterminate", checked)} />
                    <Label htmlFor="is_indeterminate" className="text-xs font-normal">Indeterminado</Label>
                  </div>
                </div>
                <Input id="total_sessions" type="number" disabled={watchedIsIndeterminate} {...register("total_sessions", { valueAsNumber: true })} className={errors.total_sessions ? "border-destructive" : ""} placeholder={watchedIsIndeterminate ? "∞" : "10"} />
                {errors.total_sessions && <p className="text-sm text-destructive">{errors.total_sessions.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência <span className="text-destructive">*</span></Label>
                <Controller
                  name="frequency" control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Início <span className="text-destructive">*</span></Label>
                <Input id="start_date" type="date" {...register("start_date")} className={errors.start_date ? "border-destructive" : ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_time">Horário <span className="text-destructive">*</span></Label>
                <Input id="preferred_time" type="time" {...register("preferred_time")} className={errors.preferred_time ? "border-destructive" : ""} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (min)</Label>
                <Input id="duration" type="number" {...register("duration_mins", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_price">Valor por Sessão</Label>
                <Controller name="session_price" control={control} render={({ field }) => <CurrencyInput id="session_price" value={field.value} onChange={field.onChange} />} />
              </div>
            </div>
          </div>
        )
      case 3: // Professional
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Responsável pelo Pacote</Label>
              <RadioGroup value={watchedProfessionalMode} onValueChange={(val) => setValue("professional_mode", val as "fixed" | "flexible")} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <RadioGroupItem value="fixed" id="fixed" className="peer sr-only" />
                  <Label htmlFor="fixed" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <User className="mb-3 h-6 w-6" />
                    <span className="font-semibold">Profissional Fixo</span>
                    <span className="text-center text-xs text-muted-foreground mt-1">Sessões vinculadas a um profissional específico</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="flexible" id="flexible" className="peer sr-only" />
                  <Label htmlFor="flexible" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <Briefcase className="mb-3 h-6 w-6" />
                    <span className="font-semibold">Qualquer Profissional</span>
                    <span className="text-center text-xs text-muted-foreground mt-1">Definido sessão a sessão (Agenda flexível)</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            {watchedProfessionalMode === "fixed" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="professional">Selecione o Profissional <span className="text-destructive">*</span></Label>
                <ReactSelect value={selectedProfessionalOption} onChange={(option) => setValue("professional_id", option?.value || "")} options={professionalOptions} placeholder="Buscar profissional..." showColorIndicator isClearable />
                {errors.professional_id && <p className="text-sm text-destructive">{errors.professional_id.message}</p>}
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
                    {watchedIsIndeterminate ? "Como a quantidade de sessões é indeterminada, o sistema gerará sessões para as próximas 2 semanas automaticamente." : "Para pacotes com profissional flexível, as sessões devem ser agendadas manualmente para garantir a disponibilidade."}
                  </p>
                </div>
              ) : (
                <RadioGroup value={watchedTotalSessions > 0 ? (getValues("generate_all") ? "all" : "auto") : "auto"} onValueChange={(val) => setValue("generate_all", val === "all")} className="grid gap-4">
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <RadioGroupItem value="all" id="gen-all" />
                    <div className="space-y-1">
                      <Label htmlFor="gen-all" className="font-medium">Gerar todas as {watchedTotalSessions} sessões agora</Label>
                      <p className="text-sm text-muted-foreground">Reserva todos os horários na agenda do profissional.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <RadioGroupItem value="auto" id="gen-auto" />
                    <div className="space-y-1">
                      <Label htmlFor="gen-auto" className="font-medium">Gerar aos poucos (Automático)</Label>
                      <p className="text-sm text-muted-foreground">O sistema mantém a agenda preenchida para as próximas 2 semanas.</p>
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
                  <DialogDescription>Enviar lembretes e solicitar confirmação automática</DialogDescription>
                </div>
                <Switch checked={watch("whatsapp_confirmation")} onCheckedChange={(checked) => setValue("whatsapp_confirmation", checked)} />
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
                  <div><span className="text-muted-foreground block mb-1">Paciente</span><span className="font-medium">{selectedPatientOption?.label}</span></div>
                  <div><span className="text-muted-foreground block mb-1">Profissional</span><span className="font-medium">{watchedProfessionalMode === "fixed" ? selectedProfessionalOption?.label : "Qualquer (Flexível)"}</span></div>
                  <div><span className="text-muted-foreground block mb-1">Pacote</span><span className="font-medium">{watch("title")}</span></div>
                  <div><span className="text-muted-foreground block mb-1">Sessões</span><span className="font-medium">{watchedIsIndeterminate ? "Indeterminado (Contínuo)" : `${watchedTotalSessions} sessões`}</span></div>
                  <div><span className="text-muted-foreground block mb-1">Frequência</span><span className="font-medium">{frequencyLabels[watchedFrequency as Frequency]} às {watchedPreferredTime}</span></div>
                  <div><span className="text-muted-foreground block mb-1">Início</span><span className="font-medium">{format(new Date(watchedStartDate), "dd/MM/yyyy", { locale: ptBR })}</span></div>
                </div>
              </CardContent>
            </Card>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-200">
              <p className="font-semibold mb-1">Resumo da Ação</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>O plano será criado imediatamente.</li>
                {watchedProfessionalMode === "flexible" ? <li>As sessões <strong>não serão geradas</strong> automaticamente (requer agendamento manual).</li> : getValues("generate_all") && !watchedIsIndeterminate ? <li>Serão gerados <strong>{watchedTotalSessions} agendamentos</strong> na agenda.</li> : <li>O sistema gerará agendamentos para as <strong>próximas 2 semanas</strong>.</li>}
                {watch("whatsapp_confirmation") && <li>O paciente receberá confirmações via WhatsApp antes de cada sessão.</li>}
              </ul>
            </div>
          </div>
        )
      default: return null
    }
  }

  const sortOptions: SelectOption[] = [
    { value: "created_desc", label: "Mais Recente" },
    { value: "created_asc", label: "Mais Antigo" },
    { value: "title_asc", label: "Ordenar: A-Z" },
    { value: "title_desc", label: "Ordenar: Z-A" },
  ]

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Planos de Sessão" tutorialPage="planos-sessao" />
      <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"><Calendar className="w-6 h-6" /></div>
            <div>
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Total de planos</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0"><Activity className="w-6 h-6" /></div>
            <div>
              <div className="text-2xl font-bold">{statusParam === "all" ? activeCount : (statusParam === "active" ? total : 0)}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Planos ativos</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0"><Check className="w-6 h-6" /></div>
            <div>
              <div className="text-2xl font-bold">{statusParam === "all" ? completedCount : (statusParam === "completed" ? total : 0)}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">Planos concluídos</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-3 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[300px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar planos..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-10 h-10 border-none shadow-none bg-muted/50 rounded-lg focus-visible:ring-1" />
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex p-1 gap-1 items-center">
              <Button variant="outline" size="sm" className={`rounded-full h-8 px-4 text-xs font-semibold ${statusParam === "all" ? "border-primary text-primary" : "border-border text-muted-foreground"}`} onClick={() => updateQueryParams({ status: "all" })}>Todos</Button>
              <Button variant="outline" size="sm" className={`rounded-full h-8 px-4 text-xs font-semibold ${statusParam === "active" ? "border-emerald-500 text-emerald-500" : "border-border text-muted-foreground"}`} onClick={() => updateQueryParams({ status: "active" })}><div className={`w-1.5 h-1.5 rounded-full mr-2 ${statusParam === "active" ? "bg-emerald-500" : "bg-emerald-500/50"}`} />Ativos</Button>
              <Button variant="outline" size="sm" className={`rounded-full h-8 px-4 text-xs font-semibold ${statusParam === "paused" ? "border-yellow-500 text-yellow-500" : "border-border text-muted-foreground"}`} onClick={() => updateQueryParams({ status: "paused" })}><div className={`w-1.5 h-1.5 rounded-full mr-2 ${statusParam === "paused" ? "bg-yellow-500" : "bg-yellow-500/50"}`} />Pausados</Button>
            </div>
            <div className="w-[180px] border-l border-border/50 pl-2">
              <ReactSelect value={sortOptions.find((opt) => opt.value === sortBy) || sortOptions[0]} onChange={(option) => updateQueryParams({ sort_by: option?.value || "created_desc" })} options={sortOptions} isSearchable={false} placeholder="Ordenar..." />
            </div>
            <Button className="h-10 px-5 font-semibold bg-primary hover:bg-primary/90 rounded-lg ml-2" onClick={handleOpenDialog}><Plus className="mr-2 h-4 w-4" />Novo Plano</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg font-medium">{search || statusParam !== "all" ? "Nenhum plano encontrado" : "Nenhum plano cadastrado"}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col pt-2 pb-6">
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                     <SortableTableHead sortKey="title" title="PLANO" className="w-[280px]" />
                     <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">PACIENTE</TableHead>
                     <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">FREQUÊNCIA</TableHead>
                     <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">PROGRESSO</TableHead>
                     <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">STATUS</TableHead>
                     <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/70">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id} className="group">
                      <TableCell>
                        <div className="font-bold text-foreground text-base truncate">{plan.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plan.description || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2"><User className="h-3 w-3 text-muted-foreground" />{plan.patient_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3 w-3" /><span>{frequencyLabels[plan.frequency]} às {plan.preferred_time}</span></div>
                      </TableCell>
                      <TableCell>
                        <div className="w-[100px] space-y-1.5">
                          <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                            <span>{plan.sessions_done}/{plan.total_sessions === -1 ? "∞" : plan.total_sessions}</span>
                            <span>{plan.progress}%</span>
                          </div>
                          <Progress value={plan.progress} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell>
                         <Badge variant={statusVariants[plan.status]} className="font-medium px-2 py-0.5">{statusLabels[plan.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {plan.status === "active" && (
                            <>
                              <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground hover:text-green-500 hover:bg-green-500/10" title="Gerar Sessões" onClick={() => handleGenerate(plan.id)}><RefreshCw className="h-3 w-3" /></Button>
                              <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10" title="Pausar" onClick={() => handlePause(plan.id)}><Pause className="h-3 w-3" /></Button>
                            </>
                          )}
                          {plan.status === "paused" && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10" title="Retomar" onClick={() => handleResume(plan.id)}><Play className="h-3 w-3 ml-0.5" /></Button>
                          )}
                          {plan.status !== "cancelled" && plan.status !== "completed" && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Cancelar" onClick={() => handleCancel(plan.id)}><X className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DataTablePagination meta={{ page, limit, total, total_pages: totalPages }} entityName="planos" />
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle>Novo Plano de Sessão</DialogTitle>
              <DialogDescription>Crie um plano recorrente para facilitar o agendamento</DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex items-center justify-between px-2 text-sm text-muted-foreground">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${currentStep === step.id ? "border-primary bg-primary text-primary-foreground text-xs" : currentStep > step.id ? "border-primary bg-primary/20 text-primary text-xs" : "border-muted text-muted-foreground text-xs"}`}>
                    {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                  </div>
                  <span className={`mt-2 hidden sm:block text-[10px] font-medium ${currentStep === step.id ? "text-foreground" : ""}`}>{step.title}</span>
                </div>
              ))}
            </div>
          </div>
          <form className="p-6">
            <div className="min-h-[300px] max-h-[50vh] overflow-y-auto">
              {renderStepContent()}
            </div>
          </form>
          <div className="p-6 pt-0 border-t bg-muted/20 flex justify-between mt-4 border-t-2 border-dashed border-border/50 items-center">
             <div className="pt-4 flex w-full justify-between">
                <Button type="button" variant="outline" onClick={currentStep === 1 ? () => setIsDialogOpen(false) : handleBack} disabled={isSubmitting}>
                  {currentStep === 1 ? "Cancelar" : <><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</>}
                </Button>
                {currentStep < steps.length ? (
                  <Button type="button" onClick={handleNext}>Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                ) : (
                  <Button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>{isSubmitting ? "Criando..." : "Criar Plano"}</Button>
                )}
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}