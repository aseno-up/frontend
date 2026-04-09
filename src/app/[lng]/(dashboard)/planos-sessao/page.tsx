"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, Play, Pause, X, Calendar, Clock, User, Users, Briefcase, Check, ArrowRight, ArrowLeft, Search, Activity, CreditCard, Trash2, DollarSign, ChevronRight, UserPlus, ClipboardCheck } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker, TimePickerInline } from "@/components/ui/time-picker"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import { SessionPlan, Professional, Patient, PlanStatus, Frequency, Enrollment, AttendanceRecord } from "@/types/api"
import { EnrollmentDialog } from "@/components/session-plans/enrollment-dialog"
import { GroupAttendanceDialog } from "@/components/session-plans/group-attendance-dialog"
import { PlanPaymentDialog } from "@/components/session-plans/plan-payment-dialog"
import { PlanDetailModal } from "@/components/session-plans/plan-detail-modal"

// Schema
const WEEK_DAYS_MAP = [
  { value: 0, label: "Dom", short: "D", abbr: "SU" },
  { value: 1, label: "Seg", short: "S", abbr: "MO" },
  { value: 2, label: "Ter", short: "T", abbr: "TU" },
  { value: 3, label: "Qua", short: "Q", abbr: "WE" },
  { value: 4, label: "Qui", short: "Q", abbr: "TH" },
  { value: 5, label: "Sex", short: "S", abbr: "FR" },
  { value: 6, label: "Sáb", short: "S", abbr: "SA" },
]

// How many days the user should pick per frequency
const FREQUENCY_DAY_COUNT: Record<string, number | null> = {
  daily: null,
  weekly: 1,
  biweekly: 2,
  triweekly: 3,
  bimonthly: 1,
  monthly: null,
  custom: null, // any number
}

const sessionPlanSchema = z.object({
  plan_type: z.enum(["individual", "group"]).default("individual"),
  patient_id: z.string().optional(),
  professional_id: z.string().optional(),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "biweekly", "triweekly", "bimonthly", "monthly", "custom"]),
  week_days: z.array(z.number()).default([]),
  preferred_time: z.string().min(1, "Horário é obrigatório"),
  day_times: z.record(z.string(), z.string()).optional(),
  duration_mins: z.number().min(15, "Mínimo 15 minutos").max(480, "Máximo 480 minutos"),
  total_sessions: z.number().min(-1, "Inválido").max(200, "Máximo 200 sessões"),
  is_indeterminate: z.boolean().default(false),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  session_price: z.number().min(0, "Valor não pode ser negativo").optional(),
  procedure_id: z.string().optional(),
  capacity: z.number().min(1).max(50).optional(),
  payment_mode: z.enum(["per_session", "upfront", "monthly"]).default("per_session"),
  notes: z.string().optional(),

  // Wizard specific fields
  professional_mode: z.enum(["fixed", "flexible"]).default("fixed"),
  generation_mode: z.enum(["auto", "manual"]).default("auto"),
  generate_all: z.boolean().default(false),
  whatsapp_confirmation: z.boolean().optional().default(true),
}).refine((data) => {
  if (data.plan_type === "individual" && !data.patient_id) {
    return false
  }
  return true
}, {
  message: "Paciente é obrigatório para plano individual",
  path: ["patient_id"],
}).refine((data) => {
  if (data.plan_type === "group" && (!data.capacity || data.capacity < 1)) {
    return false
  }
  return true
}, {
  message: "Capacidade é obrigatória para turmas",
  path: ["capacity"],
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

const paymentModeLabels: Record<string, string> = {
  per_session: "Por Sessão",
  upfront: "Pré-pago Total",
  monthly: "Mensalidade",
}

const steps = [
  { id: 1, title: "Tipo" },
  { id: 2, title: "Pacote" },
  { id: 3, title: "Profissional" },
  { id: 4, title: "Pagamento" },
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
  const [procedures, setProcedures] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  
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

  // Bulk Actions & Cancel state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [planToCancel, setPlanToCancel] = useState<SessionPlan | null>(null)
  const [bulkCancelModalOpen, setBulkCancelModalOpen] = useState(false)

  // Payment entries for wizard step 4 (split payments)
  interface PaymentEntry { id: string; method_id: string; amount: number; installments: number }
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([])

  // Detail modal state
  const [detailPlan, setDetailPlan] = useState<SessionPlan | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailAppointments, setDetailAppointments] = useState<any[]>([])
  const [detailPayments, setDetailPayments] = useState<any[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  // Enrollment dialog state (group plans)
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false)

  // Group attendance dialog state
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false)
  const [attendanceAppointmentId, setAttendanceAppointmentId] = useState("")
  const [attendanceSessionPlanId, setAttendanceSessionPlanId] = useState("")

  // Plan payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentSessionPlanId, setPaymentSessionPlanId] = useState("")
  const [paymentEnrollmentId, setPaymentEnrollmentId] = useState<string | undefined>(undefined)
  const [detailEnrollments, setDetailEnrollments] = useState<Enrollment[]>([])
  const [detailRefreshKey, setDetailRefreshKey] = useState(0)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(plans.map(p => p.id))
      setSelectedIds(allIds)
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (checked: boolean, id: string) => {
    const newSet = new Set(selectedIds)
    if (checked) newSet.add(id)
    else newSet.delete(id)
    setSelectedIds(newSet)
  }

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
      week_days: [],
      preferred_time: "09:00",
      duration_mins: 50,
      total_sessions: 10,
      is_indeterminate: false,
      start_date: format(new Date(), "yyyy-MM-dd"),
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

  const procedureOptions: SelectOption[] = useMemo(() => {
    return procedures.map((proc: any) => ({
      value: proc.id,
      label: `${proc.name} (R$ ${(proc.price || 0).toFixed(2)})`,
      basePrice: proc.price,
    }))
  }, [procedures])

  const watchedPlanType = watch("plan_type")
  const watchedPatientId = watch("patient_id")
  const watchedProcedureId = watch("procedure_id")
  const watchedProfessionalId = watch("professional_id")
  const watchedIsIndeterminate = watch("is_indeterminate")
  const watchedPaymentMode = watch("payment_mode")
  const watchedCapacity = watch("capacity")
  const watchedProfessionalMode = watch("professional_mode")
  const watchedTotalSessions = watch("total_sessions")
  const watchedSessionPrice = watch("session_price")
  const watchedStartDate = watch("start_date")
  const watchedPreferredTime = watch("preferred_time")
  const watchedFrequency = watch("frequency")
  const watchedWeekDays = watch("week_days") || []
  
  const selectedPatientOption = useMemo(() => {
    if (!watchedPatientId) return null
    return patientOptions.find((opt) => opt.value === watchedPatientId) || null
  }, [watchedPatientId, patientOptions])

  const selectedProfessionalOption = useMemo(() => {
    if (!watchedProfessionalId) return null
    return professionalOptions.find((opt) => opt.value === watchedProfessionalId) || null
  }, [watchedProfessionalId, professionalOptions])

  // Reset payment mode when indeterminate is toggled on and upfront is selected
  useEffect(() => {
    if (watchedIsIndeterminate && watchedPaymentMode === "upfront") {
      setValue("payment_mode", "per_session")
    }
  }, [watchedIsIndeterminate, watchedPaymentMode, setValue])

  // Auto-suggest week days when frequency or start date changes
  useEffect(() => {
    const expectedCount = FREQUENCY_DAY_COUNT[watchedFrequency]
    if (expectedCount === null || expectedCount === undefined) return // daily/monthly don't need day selection

    // Only auto-suggest if user hasn't manually picked the right number of days
    if (watchedWeekDays.length === expectedCount) return

    if (!watchedStartDate) return
    const startDay = new Date(watchedStartDate + "T12:00:00").getDay() // 0=Sun..6=Sat

    let suggested: number[] = []
    if (expectedCount === 1) {
      suggested = [startDay]
    } else if (expectedCount === 2) {
      // start day + 3 days later (e.g., Mon+Thu)
      suggested = [startDay, (startDay + 3) % 7].sort((a, b) => a - b)
    } else if (expectedCount === 3) {
      // start day + 2 + 4 (e.g., Mon+Wed+Fri)
      suggested = [startDay, (startDay + 2) % 7, (startDay + 4) % 7].sort((a, b) => a - b)
    }
    setValue("week_days", suggested)
  }, [watchedFrequency, watchedStartDate, setValue]) // intentionally exclude watchedWeekDays to avoid loops

  // Computed total for upfront
  const upfrontTotal = useMemo(() => {
    const price = watchedSessionPrice || 0
    const sessions = watchedTotalSessions || 0
    return price * sessions
  }, [watchedSessionPrice, watchedTotalSessions])

  const paymentEntriesTotal = useMemo(() => {
    return paymentEntries.reduce((sum, e) => sum + (e.amount || 0), 0)
  }, [paymentEntries])

  const paymentRemaining = useMemo(() => {
    if (watchedPaymentMode === "upfront") return Math.max(0, upfrontTotal - paymentEntriesTotal)
    return 0
  }, [watchedPaymentMode, upfrontTotal, paymentEntriesTotal])

  const selectedProcedureOption = useMemo(() => {
    if (!watchedProcedureId) return null
    return procedureOptions.find((opt) => opt.value === watchedProcedureId) || null
  }, [watchedProcedureId, procedureOptions])

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
      setSelectedIds(new Set())
      
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

  const fetchProcedures = useCallback(async () => {
    try {
      const data = await api.getProcedures({ limit: 100 })
      setProcedures(data.data || [])
    } catch {}
  }, [])

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const data = await api.getActivePaymentMethods()
      setPaymentMethods(data.data || data || [])
    } catch {}
  }, [])

  useEffect(() => {
    fetchPlans()
    fetchProfessionals()
    fetchPatients()
    fetchProcedures()
    fetchPaymentMethods()
  }, [fetchPlans, fetchProfessionals, fetchPatients, fetchProcedures, fetchPaymentMethods])

  const handleNext = async () => {
    let fieldsToValidate: (keyof SessionPlanFormData)[] = []
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["plan_type"]
        if (watchedPlanType === "individual") fieldsToValidate.push("patient_id")
        break
      case 2: fieldsToValidate = ["title", "frequency", "preferred_time", "duration_mins", "start_date", "total_sessions"]; break
      case 3:
        fieldsToValidate = ["professional_mode"]
        if (watchedProfessionalMode === "fixed") fieldsToValidate.push("professional_id")
        break
      case 4: fieldsToValidate = ["payment_mode"]; break
    }
    const isValid = await trigger(fieldsToValidate)
    if (isValid) setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => setCurrentStep((prev) => prev - 1)

  const onSubmit = async (data: SessionPlanFormData) => {
    try {
      setIsSubmitting(true)
      const payload: any = {
        type: data.plan_type,
        patient_id: data.plan_type === "individual" ? data.patient_id : undefined,
        professional_id: data.professional_mode === "fixed" ? data.professional_id : undefined,
        title: data.title,
        description: data.description,
        frequency: data.frequency,
        week_days: data.week_days?.length ? data.week_days : undefined,
        preferred_time: data.preferred_time,
        day_times: data.day_times && Object.keys(data.day_times).length > 0 ? data.day_times : undefined,
        duration_mins: data.duration_mins,
        total_sessions: data.is_indeterminate ? -1 : data.total_sessions,
        start_date: data.start_date,
        session_price: data.session_price,
        procedure_id: data.procedure_id || undefined,
        capacity: data.plan_type === "group" ? data.capacity : undefined,
        payment_mode: data.payment_mode,
        notes: data.notes,
        generate_all: data.generate_all,
      }
      const plan = await api.createSessionPlan(payload)

      // Create payments (split) if any were added — skip for group plans (payment happens at enrollment)
      const planId = (plan as any)?.id || (plan as any)?.data?.id
      if (planId && paymentEntries.length > 0 && data.plan_type !== "group") {
        const validEntries = paymentEntries.filter((e) => e.method_id && e.amount > 0)
        for (const entry of validEntries) {
          try {
            await api.createPlanPayment(planId, {
              payment_method_id: entry.method_id,
              amount: entry.amount,
              installments: entry.installments || 1,
              notes: data.payment_mode === "monthly" ? "Mensalidade" : "Pagamento antecipado",
            })
          } catch (err) {
            handleApiError(err, "Plano criado, mas houve erro ao registrar um pagamento")
          }
        }
      }

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
      plan_type: "individual", patient_id: "", professional_id: "", title: "", description: "",
      frequency: "weekly", week_days: [], preferred_time: "09:00", day_times: undefined, duration_mins: 50,
      total_sessions: 10, is_indeterminate: false, start_date: format(new Date(), "yyyy-MM-dd"),
      session_price: 0, procedure_id: "", capacity: 10, payment_mode: "per_session",
      notes: "", professional_mode: "fixed", generation_mode: "auto",
      generate_all: false, whatsapp_confirmation: true,
    })
    setPaymentEntries([])
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

  const confirmCancel = async () => {
    if (!planToCancel) return
    try { 
      await api.cancelSessionPlan(planToCancel.id)
      showToast.success("Plano cancelado com sucesso!")
      fetchPlans() 
    } catch (err) { handleApiError(err, "Erro ao cancelar plano") }
  }

  const confirmBulkCancel = async () => {
    if (selectedIds.size === 0) return
    try {
      await api.bulkCancelSessionPlans(Array.from(selectedIds))
      showToast.success(`${selectedIds.size} planos cancelados com sucesso!`)
      setSelectedIds(new Set())
      fetchPlans()
    } catch (error) {
      handleApiError(error, "Erro ao cancelar planos em massa")
    }
  }

  // Open detail modal for a session plan
  const handleOpenDetail = async (plan: SessionPlan) => {
    setDetailPlan(plan)
    setDetailModalOpen(true)
    setDetailLoading(true)
    setDetailAppointments([])
    setDetailPayments([])

    try {
      // Fetch calendar events for this plan (past + future 90 days)
      const now = new Date()
      const parsedStart = plan.start_date ? new Date(plan.start_date + "T00:00:00") : null
      const past = parsedStart && !isNaN(parsedStart.getTime()) ? parsedStart : new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      const future = new Date(now)
      future.setDate(future.getDate() + 90)

      const [eventsResp, paymentsResp] = await Promise.all([
        api.getCalendarEvents({
          start_date: format(past, "yyyy-MM-dd"),
          end_date: format(future, "yyyy-MM-dd"),
        }),
        api.getPlanPayments(plan.id).catch(() => ({ data: [] })),
      ])

      // Filter only events belonging to this plan
      const planEvents = ((eventsResp as any)?.data || eventsResp || [])
        .filter((evt: any) => evt.session_plan_id === plan.id)
        .sort((a: any, b: any) => (new Date(a.start_time).getTime() || 0) - (new Date(b.start_time).getTime() || 0))

      setDetailAppointments(planEvents)
      setDetailPayments((paymentsResp as any)?.data || paymentsResp || [])

      // Fetch enrollments for group plans
      if (plan.type === "group") {
        api.getEnrollments(plan.id)
          .then((resp: any) => setDetailEnrollments(resp?.data || resp || []))
          .catch(() => setDetailEnrollments([]))
      } else {
        setDetailEnrollments([])
      }
    } catch (err) {
      handleApiError(err, "Erro ao carregar detalhes")
    } finally {
      setDetailLoading(false)
    }
  }

  // Session appointments are now calculated on demand via RRULE — no manual generation needed

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Type + Patient/Capacity
        return (
          <div className="space-y-4 py-4 ">
            <div className="space-y-3">
              <Label>Tipo do Plano <span className="text-destructive">*</span></Label>
              <RadioGroup value={watchedPlanType} onValueChange={(val) => setValue("plan_type", val as "individual" | "group")} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <RadioGroupItem value="individual" id="type-individual" className="peer sr-only" />
                  <Label htmlFor="type-individual" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <User className="mb-3 h-6 w-6" />
                    <span className="font-semibold">Individual</span>
                    <span className="text-center text-xs text-muted-foreground mt-1">Sessoes para um paciente</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="group" id="type-group" className="peer sr-only" />
                  <Label htmlFor="type-group" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <Users className="mb-3 h-6 w-6" />
                    <span className="font-semibold">Turma / Grupo</span>
                    <span className="text-center text-xs text-muted-foreground mt-1">Varios pacientes no mesmo horario</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {watchedPlanType === "individual" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 h-full">
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
            )}

            {watchedPlanType === "group" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="capacity">Capacidade da Turma <span className="text-destructive">*</span></Label>
                <Input id="capacity" type="number" {...register("capacity", { valueAsNumber: true })} placeholder="Ex: 10" className={errors.capacity ? "border-destructive" : ""} />
                {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
                <p className="text-xs text-muted-foreground">Maximo de pacientes por sessao. Voce podera inscrever pacientes apos criar o plano.</p>
              </div>
            )}
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
            {/* Week day picker — shown for frequencies that need day selection */}
            {(watchedFrequency === "biweekly" || watchedFrequency === "triweekly" || watchedFrequency === "custom") && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label>
                  Dias da semana <span className="text-destructive">*</span>
                  {FREQUENCY_DAY_COUNT[watchedFrequency] && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (selecione {FREQUENCY_DAY_COUNT[watchedFrequency]} {FREQUENCY_DAY_COUNT[watchedFrequency] === 1 ? "dia" : "dias"})
                    </span>
                  )}
                </Label>
                <div className="flex gap-1.5">
                  {WEEK_DAYS_MAP.map((day) => {
                    const isSelected = watchedWeekDays.includes(day.value)
                    const maxDays = FREQUENCY_DAY_COUNT[watchedFrequency]
                    const atLimit = maxDays !== null && !isSelected && watchedWeekDays.length >= (maxDays ?? 7)
                    const currentDayTimes = watch("day_times") || {}
                    return (
                      <div key={day.value} className="flex-1 flex flex-col items-stretch gap-1.5">
                        <button
                          type="button"
                          disabled={atLimit}
                          className={cn(
                            "h-10 rounded-md border-2 text-sm font-semibold transition-all",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : atLimit
                                ? "border-muted bg-muted text-muted-foreground/40 cursor-not-allowed"
                                : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
                          )}
                          onClick={() => {
                            const current = [...watchedWeekDays]
                            if (isSelected) {
                              setValue("week_days", current.filter((d) => d !== day.value))
                              const updated = { ...currentDayTimes }
                              delete updated[day.abbr]
                              setValue("day_times", Object.keys(updated).length > 0 ? updated : undefined)
                            } else {
                              setValue("week_days", [...current, day.value].sort((a, b) => a - b))
                            }
                          }}
                        >
                          {day.label}
                        </button>
                        {isSelected && watchedWeekDays.length > 1 && (
                          <TimePickerInline
                            className="h-8 text-xs px-1"
                            value={currentDayTimes[day.abbr] || ""}
                            onChange={(val) => {
                              const updated = { ...currentDayTimes }
                              if (val) {
                                updated[day.abbr] = val
                              } else {
                                delete updated[day.abbr]
                              }
                              setValue("day_times", Object.keys(updated).length > 0 ? updated : undefined)
                            }}
                            placeholder={watchedPreferredTime || "09:00"}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
                {watchedWeekDays.length > 1 && (
                  <p className="text-xs text-muted-foreground">Defina o horário de cada dia. Se vazio, usa o horário padrão.</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início <span className="text-destructive">*</span></Label>
                <DatePicker
                  value={watch("start_date")}
                  onChange={(val) => setValue("start_date", val, { shouldValidate: true })}
                  error={!!errors.start_date}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário {watchedWeekDays.length <= 1 ? <span className="text-destructive">*</span> : <span className="text-xs text-muted-foreground">(padrão)</span>}</Label>
                <TimePicker
                  value={watch("preferred_time")}
                  onChange={(val) => setValue("preferred_time", val, { shouldValidate: true })}
                  error={!!errors.preferred_time}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Procedimento</Label>
              <ReactSelect
                value={selectedProcedureOption}
                onChange={(option) => {
                  setValue("procedure_id", option?.value || "")
                  if (option?.basePrice) {
                    setValue("session_price", option.basePrice)
                  }
                  // Auto-fill title from procedure name if title is empty
                  const currentTitle = getValues("title")
                  if (option && (!currentTitle || currentTitle.trim() === "")) {
                    const cleanName = option.label.replace(/\s*\(R\$.*\)$/, "")
                    setValue("title", cleanName)
                  }
                }}
                options={procedureOptions}
                placeholder="Selecionar procedimento (opcional)..."
                isClearable
              />
              <p className="text-xs text-muted-foreground">O preco sera preenchido automaticamente do cadastro de procedimentos.</p>
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
      case 4: // Payment Mode
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Modo de Pagamento</Label>
              <RadioGroup value={watchedPaymentMode} onValueChange={(val) => setValue("payment_mode", val as "per_session" | "upfront" | "monthly")} className="grid gap-4">
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <RadioGroupItem value="per_session" id="pay-per-session" />
                  <div className="space-y-1">
                    <Label htmlFor="pay-per-session" className="font-medium">Por Sessão</Label>
                    <p className="text-sm text-muted-foreground">O paciente paga a cada sessão realizada.</p>
                  </div>
                </div>
                <div className={cn("flex items-start space-x-3 space-y-0 rounded-md border p-4", watchedIsIndeterminate && "opacity-50 cursor-not-allowed")}>
                  <RadioGroupItem value="upfront" id="pay-upfront" disabled={watchedIsIndeterminate} />
                  <div className="space-y-1">
                    <Label htmlFor="pay-upfront" className={cn("font-medium", watchedIsIndeterminate && "cursor-not-allowed")}>Pré-pago Total</Label>
                    <p className="text-sm text-muted-foreground">
                      {watchedIsIndeterminate
                        ? "Nao disponivel para sessoes indeterminadas."
                        : watchedPlanType === "group"
                        ? "O aluno paga o valor total antecipadamente no momento da inscricao."
                        : "O paciente paga o valor total antecipadamente. Cada sessao aparecera como \"ja paga\"."}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <RadioGroupItem value="monthly" id="pay-monthly" />
                  <div className="space-y-1">
                    <Label htmlFor="pay-monthly" className="font-medium">Mensalidade</Label>
                    <p className="text-sm text-muted-foreground">
                      {watchedPlanType === "group"
                        ? "O aluno paga um valor fixo mensal independente do numero de sessoes."
                        : "O paciente paga um valor fixo mensal independente do numero de sessoes."}
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
            {/* For group plans, payment mode is just a recommendation — no actual payment at creation */}
            {watchedPlanType === "group" && (watchedPaymentMode === "upfront" || watchedPaymentMode === "monthly") && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                <p className="font-medium">Modo padrão para inscrições</p>
                <p className="text-xs mt-1">Este modo será sugerido como padrão ao inscrever cada aluno na turma. O pagamento será registrado no momento da inscrição, não agora.</p>
              </div>
            )}
            {/* Split payment — shown for upfront and monthly, only for individual plans */}
            {watchedPlanType !== "group" && (watchedPaymentMode === "upfront" || watchedPaymentMode === "monthly") && (
              <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                {watchedPaymentMode === "upfront" && !watchedIsIndeterminate && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200">
                    <div className="flex items-center justify-between">
                      <span>Valor total:</span>
                      <span className="font-bold text-lg">R$ {upfrontTotal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs mt-1 text-blue-600 dark:text-blue-300">
                      {watchedTotalSessions} sessoes x R$ {(watchedSessionPrice || 0).toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Pagamentos</Label>
                  <Button
                    type="button" variant="outline" size="sm"
                    onClick={() => {
                      const defaultAmount = watchedPaymentMode === "upfront" ? paymentRemaining : (watchedSessionPrice || 0)
                      setPaymentEntries((prev) => [...prev, {
                        id: crypto.randomUUID(),
                        method_id: paymentMethods[0]?.id || "",
                        amount: Math.max(0, defaultAmount),
                        installments: 1,
                      }])
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Adicionar
                  </Button>
                </div>

                {paymentEntries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    Clique em "Adicionar" para registrar um pagamento.
                  </p>
                )}

                <div className="space-y-3">
                  {paymentEntries.map((entry, idx) => (
                    <div key={entry.id} className="rounded-lg border p-3 space-y-3 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Pagamento {idx + 1}</span>
                        <Button
                          type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => setPaymentEntries((prev) => prev.filter((e) => e.id !== entry.id))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Forma</Label>
                          <Select
                            value={entry.method_id}
                            onValueChange={(v) => setPaymentEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, method_id: v } : e))}
                          >
                            <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
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
                            value={entry.amount}
                            onChange={(v) => setPaymentEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, amount: v || 0 } : e))}
                            className="h-9"
                          />
                        </div>
                      </div>
                      {watchedPaymentMode === "upfront" && (
                        <div className="space-y-1">
                          <Label className="text-xs">Parcelas</Label>
                          <Select
                            value={String(entry.installments)}
                            onValueChange={(v) => setPaymentEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, installments: parseInt(v) } : e))}
                          >
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                                <SelectItem key={n} value={String(n)}>{n}x{n === 1 ? " (a vista)" : ""}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {paymentEntries.length > 0 && (
                  <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">
                    <span>Total dos pagamentos:</span>
                    <span className={cn("font-bold", watchedPaymentMode === "upfront" && paymentEntriesTotal < upfrontTotal && "text-amber-600", watchedPaymentMode === "upfront" && paymentEntriesTotal >= upfrontTotal && "text-green-600")}>
                      R$ {paymentEntriesTotal.toFixed(2)}
                      {watchedPaymentMode === "upfront" && paymentRemaining > 0 && (
                        <span className="text-xs text-amber-600 ml-2">(falta R$ {paymentRemaining.toFixed(2)})</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

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
                  <div><span className="text-muted-foreground block mb-1">Tipo</span><span className="font-medium">{watchedPlanType === "individual" ? "Individual" : `Turma (${watchedCapacity} vagas)`}</span></div>
                  {watchedPlanType === "individual" && (
                    <div><span className="text-muted-foreground block mb-1">Paciente</span><span className="font-medium">{selectedPatientOption?.label}</span></div>
                  )}
                  <div><span className="text-muted-foreground block mb-1">Profissional</span><span className="font-medium">{watchedProfessionalMode === "fixed" ? selectedProfessionalOption?.label : "Qualquer (Flexível)"}</span></div>
                  <div><span className="text-muted-foreground block mb-1">Pacote</span><span className="font-medium">{watch("title")}</span></div>
                  {selectedProcedureOption && (
                    <div><span className="text-muted-foreground block mb-1">Procedimento</span><span className="font-medium">{selectedProcedureOption.label}</span></div>
                  )}
                  <div><span className="text-muted-foreground block mb-1">Sessões</span><span className="font-medium">{watchedIsIndeterminate ? "Indeterminado (Contínuo)" : `${watchedTotalSessions} sessões`}</span></div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Frequência</span>
                    <span className="font-medium">{frequencyLabels[watchedFrequency as Frequency]}</span>
                    {(() => {
                      const dt = watch("day_times")
                      const hasDayTimes = dt && Object.keys(dt).length > 0
                      if (hasDayTimes && watchedWeekDays.length > 1) {
                        return (
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            {watchedWeekDays
                              .slice()
                              .sort((a: number, b: number) => a - b)
                              .map((d: number) => {
                                const day = WEEK_DAYS_MAP[d]
                                const time = day ? (dt[day.abbr] || watchedPreferredTime) : watchedPreferredTime
                                return `${day?.label} ${time}`
                              })
                              .join(" · ")}
                          </span>
                        )
                      }
                      return (
                        <>
                          <span className="font-medium"> às {watchedPreferredTime}</span>
                          {watchedWeekDays.length > 0 && (
                            <span className="block text-xs text-muted-foreground mt-0.5">
                              {watchedWeekDays.map((d: number) => WEEK_DAYS_MAP[d]?.label).join(", ")}
                            </span>
                          )}
                        </>
                      )
                    })()}
                  </div>
                  <div><span className="text-muted-foreground block mb-1">Início</span><span className="font-medium">{format(new Date(watchedStartDate + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</span></div>
                  <div><span className="text-muted-foreground block mb-1">Pagamento</span><span className="font-medium">{paymentModeLabels[watchedPaymentMode]}</span></div>
                </div>
              </CardContent>
            </Card>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-200">
              <p className="font-semibold mb-1">Resumo da Ação</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>O plano será criado imediatamente.</li>
                <li>As sessões aparecerão automaticamente no calendário.</li>
                {watchedPlanType === "group" && <li>Você poderá <strong>inscrever pacientes</strong> na turma após criar o plano.</li>}
                {watchedPaymentMode === "upfront" && watchedPlanType !== "group" && <li>O pagamento total deverá ser registrado no plano. Cada sessão aparecerá como "já paga".</li>}
                {watchedPaymentMode === "upfront" && watchedPlanType === "group" && <li>O pagamento antecipado será registrado ao inscrever cada aluno.</li>}
                {watch("whatsapp_confirmation") && <li>Confirmações via WhatsApp serão enviadas antes de cada sessão.</li>}
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
      <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
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

        <div className="bg-card rounded-xl border border-border shadow-sm p-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="relative flex-1 min-w-[300px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar planos..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-10 h-10 border-none shadow-none bg-muted/50 rounded-lg focus-visible:ring-1" />
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {selectedIds.size > 0 && (
              <Button 
                variant="destructive" 
                className="h-9 px-4 font-semibold mr-2 animate-in fade-in"
                onClick={() => setBulkCancelModalOpen(true)}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar ({selectedIds.size})
              </Button>
            )}
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
          <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col flex-1">
            <Table className="text-sm" wrapperClassName="flex-1 overflow-auto">
              <TableHeader className="sticky top-0 bg-slate-50 z-20 shadow-sm dark:bg-slate-900 border-b">
                  <TableRow>
                     <TableHead className="w-[40px] px-4">
                      <Checkbox 
                        checked={plans.length > 0 && selectedIds.size === plans.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                     <SortableTableHead sortKey="title" title="PLANO" className="w-[280px]" />
                     <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">PACIENTE</TableHead>
                     <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">FREQUÊNCIA</TableHead>
                     <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">PROGRESSO</TableHead>
                     <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">STATUS</TableHead>
                     <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/70">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => {
                    const isSelected = selectedIds.has(plan.id)
                    return (
                    <TableRow key={plan.id} className="group cursor-pointer hover:bg-muted/50" data-state={isSelected ? "selected" : undefined} onClick={() => handleOpenDetail(plan)}>
                      <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectOne(!!checked, plan.id)}
                          aria-label={`Selecionar plano ${plan.title}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-foreground text-base truncate">{plan.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plan.description || "—"}</div>
                      </TableCell>
                      <TableCell>
                        {plan.type === "group" ? (
                          <div className="flex items-center gap-2"><Users className="h-3 w-3 text-muted-foreground" /><span>Turma ({plan.capacity ?? "?"} vagas)</span></div>
                        ) : (
                          <div className="flex items-center gap-2"><User className="h-3 w-3 text-muted-foreground" />{plan.patient_name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3 w-3" /><span>{frequencyLabels[plan.frequency]} às {plan.preferred_time}</span></div>
                      </TableCell>
                      <TableCell>
                        {plan.type === "group" ? (
                          <div className="w-[100px] text-[11px] text-muted-foreground">
                            <span className="font-medium">Por aluno</span>
                          </div>
                        ) : (
                          <div className="w-[100px] space-y-1.5">
                            <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                              <span>{plan.sessions_done}/{plan.total_sessions === -1 ? "∞" : plan.total_sessions}</span>
                              {plan.total_sessions !== -1 && <span>{Math.round(plan.progress)}%</span>}
                            </div>
                            {plan.total_sessions !== -1 ? (
                              <Progress value={plan.progress} className="h-1.5" />
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Contínuo</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                         <Badge variant={statusVariants[plan.status]} className="font-medium px-2 py-0.5">{statusLabels[plan.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          {plan.status === "active" && (
                            <>
                              <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10" title="Pausar" onClick={() => handlePause(plan.id)}><Pause className="h-3 w-3" /></Button>
                            </>
                          )}
                          {plan.status === "paused" && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10" title="Retomar" onClick={() => handleResume(plan.id)}><Play className="h-3 w-3 ml-0.5" /></Button>
                          )}
                           {plan.status !== "cancelled" && plan.status !== "completed" && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Cancelar" onClick={() => { setPlanToCancel(plan); setCancelModalOpen(true); }}><X className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            <div className="border-t p-4 shrink-0 bg-card">
              <DataTablePagination meta={{ page, limit, total, total_pages: totalPages }} entityName="planos" />
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] min-h-[85vh] max-h-[90vh] flex flex-col p-0">
          <div className="p-6 pb-0 shrink-0">
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
          <form className="flex-1 overflow-y-auto p-6">
            <div className="min-h-[300px] pb-[200px]">
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
      
      {/* Detail Modal */}
      <PlanDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        plan={detailPlan}
        appointments={detailAppointments}
        payments={detailPayments}
        loading={detailLoading}
        onOpenEnrollment={() => setEnrollmentDialogOpen(true)}
        onOpenAttendance={(appointmentId, sessionPlanId) => {
          setAttendanceAppointmentId(appointmentId)
          setAttendanceSessionPlanId(sessionPlanId)
          setAttendanceDialogOpen(true)
        }}
        onOpenPayment={() => {
          setPaymentEnrollmentId(undefined)
          setPaymentSessionPlanId(detailPlan!.id)
          setPaymentDialogOpen(true)
        }}
        onOpenPaymentForEnrollment={(enrollmentId) => {
          setPaymentEnrollmentId(enrollmentId)
          setPaymentSessionPlanId(detailPlan!.id)
          setPaymentDialogOpen(true)
        }}
        onPlanUpdated={async () => {
          fetchPlans()
          if (detailPlan) {
            try {
              const updated = await api.getSessionPlan(detailPlan.id)
              setDetailPlan(updated?.data || updated)
            } catch {}
          }
        }}
        refreshKey={detailRefreshKey}
      />

      <ConfirmDialog
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        onConfirm={confirmCancel}
        title="Cancelar Plano de Sessão"
        description={`Tem certeza que deseja cancelar o plano ${planToCancel?.title}? Esta ação não pode ser desfeita e novas sessões não serão geradas.`}
      />

      <ConfirmDialog
        open={bulkCancelModalOpen}
        onOpenChange={setBulkCancelModalOpen}
        onConfirm={confirmBulkCancel}
        title="Cancelar Planos de Sessão"
        description={`Tem certeza que deseja cancelar ${selectedIds.size} planos selecionados? Esta ação não pode ser desfeita.`}
      />

      {/* Enrollment Dialog (group plans) */}
      {detailPlan && detailPlan.type === "group" && (
        <EnrollmentDialog
          open={enrollmentDialogOpen}
          onOpenChange={(open) => {
            setEnrollmentDialogOpen(open)
            if (!open && detailPlan) {
              setDetailRefreshKey(k => k + 1)
              // Refresh enrollments when dialog closes
              api.getEnrollments(detailPlan.id)
                .then((resp: any) => setDetailEnrollments(resp?.data || resp || []))
                .catch(() => {})
            }
          }}
          sessionPlanId={detailPlan.id}
          sessionPlanTitle={detailPlan.title}
          capacity={detailPlan.capacity}
          defaultPaymentMode={detailPlan.payment_mode}
          planTotalSessions={detailPlan.total_sessions}
          planPrice={detailPlan.price_override ?? detailPlan.session_price}
          onOpenPaymentForEnrollment={(enrollmentId) => {
            setPaymentEnrollmentId(enrollmentId)
            setPaymentSessionPlanId(detailPlan.id)
            setPaymentDialogOpen(true)
          }}
        />
      )}

      {/* Group Attendance Dialog */}
      <GroupAttendanceDialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
        appointmentId={attendanceAppointmentId}
        sessionPlanId={attendanceSessionPlanId}
      />

      {/* Plan Payment Dialog */}
      <PlanPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={(open) => {
          setPaymentDialogOpen(open)
          if (!open) {
            setPaymentEnrollmentId(undefined)
            setDetailRefreshKey(k => k + 1)
            if (detailPlan) {
              // Refresh payments when dialog closes
              api.getPlanPayments(detailPlan.id).then(resp => {
                setDetailPayments((resp as any)?.data || resp || [])
              }).catch(() => {})
              // Refresh enrollments for group plans (to update payment display)
              if (detailPlan.type === "group") {
                api.getEnrollments(detailPlan.id)
                  .then((resp: any) => setDetailEnrollments(resp?.data || resp || []))
                  .catch(() => {})
              }
            }
          }
        }}
        sessionPlanId={paymentSessionPlanId}
        enrollmentId={paymentEnrollmentId}
        paymentMode={detailPlan?.payment_mode}
        isGroup={detailPlan?.type === "group"}
        enrollments={detailEnrollments}
      />
    </div>
  )
}