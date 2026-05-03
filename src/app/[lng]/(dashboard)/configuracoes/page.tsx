"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, Bell, CreditCard, Users, Loader2, Check, Copy, ExternalLink, Link2, Wallet, Plus, Pencil, Trash2, Store, CheckCircle2, Clock, XCircle, Eye, EyeOff, FileText, Layout, Sparkles, ChevronRight } from "lucide-react"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuthStore } from "@/stores/auth-store"
import { api } from "@/lib/api/client"
import { handleApiError, showToast } from "@/lib/toast"
import { CalendarIntegration, BillingCustomer, Payment, Subscription, PaymentStatus, PixQRCode, PaymentMethod, PaymentMethodType, Subaccount, SplitConfig, ClinicSettings } from "@/types/api"
import { GoogleCalendarLogo } from "@/components/icons/google-logos"
import { PlanRestriction } from "@/components/plan-restriction"

// Schema de validacao para dados de cobranca
const customerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  document: z.string().min(11, "CPF/CNPJ invalido"),
  phone: z.string().optional(),
  postal_code: z.string().optional(),
  address: z.string().optional(),
  address_number: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, "Use a sigla do estado (ex: SP)").optional(),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface ConfiguracoesPageProps {
  params: Promise<{ lng: string }>
}

const VALID_TABS = ["clinica", "automacao", "anamnese", "integracoes", "assinatura", "pagamentos", "financeiro", "conta"] as const
type TabValue = typeof VALID_TABS[number]

const paymentStatusLabels: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pendente', variant: 'outline' },
  RECEIVED: { label: 'Recebido', variant: 'default' },
  CONFIRMED: { label: 'Confirmado', variant: 'default' },
  OVERDUE: { label: 'Vencido', variant: 'destructive' },
  REFUNDED: { label: 'Reembolsado', variant: 'secondary' },
  RECEIVED_IN_CASH: { label: 'Recebido em Dinheiro', variant: 'default' },
  REFUND_REQUESTED: { label: 'Reembolso Solicitado', variant: 'secondary' },
  REFUND_IN_PROGRESS: { label: 'Reembolso em Andamento', variant: 'secondary' },
  CHARGEBACK_REQUESTED: { label: 'Chargeback Solicitado', variant: 'destructive' },
  CHARGEBACK_DISPUTE: { label: 'Disputa de Chargeback', variant: 'destructive' },
  AWAITING_CHARGEBACK_REVERSAL: { label: 'Aguardando Reversao', variant: 'secondary' },
  DUNNING_REQUESTED: { label: 'Cobranca Solicitada', variant: 'outline' },
  DUNNING_RECEIVED: { label: 'Cobranca Recebida', variant: 'default' },
  AWAITING_RISK_ANALYSIS: { label: 'Analise de Risco', variant: 'outline' },
  CANCELED: { label: 'Cancelado', variant: 'secondary' },
}

const billingTypeLabels: Record<string, string> = {
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartao de Credito',
  DEBIT_CARD: 'Cartao de Debito',
  PIX: 'PIX',
  UNDEFINED: 'Indefinido',
}

export default function ConfiguracoesPage({ params }: ConfiguracoesPageProps) {
  const [lng, setLng] = useState("pt-BR")
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clinic, user, setClinic } = useAuthStore()

  // Tab navigation state (synced with ?tab=)
  const initialTab: TabValue = (() => {
    const t = searchParams.get("tab")
    return (t && (VALID_TABS as readonly string[]).includes(t) ? t : "clinica") as TabValue
  })()
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab)

  // Clinic editing state
  const [clinicName, setClinicName] = useState(clinic?.name || "")
  const [isSavingClinic, setIsSavingClinic] = useState(false)
  const clinicNameChanged = clinicName !== (clinic?.name || "")

  // Clinic contact/profile fields state
  const [phone, setPhone] = useState(clinic?.phone || "")
  const [doc, setDoc] = useState(clinic?.document || "")
  const [address, setAddress] = useState(clinic?.address || "")
  const [city, setCity] = useState(clinic?.city || "")
  const [uf, setUf] = useState(clinic?.state || "")
  const [zipCode, setZipCode] = useState(clinic?.zip_code || "")
  const [instagram, setInstagram] = useState(clinic?.instagram || "")
  const [isSavingContact, setIsSavingContact] = useState(false)
  const contactChanged =
    phone !== (clinic?.phone || "") ||
    doc !== (clinic?.document || "") ||
    address !== (clinic?.address || "") ||
    city !== (clinic?.city || "") ||
    uf !== (clinic?.state || "") ||
    zipCode !== (clinic?.zip_code || "") ||
    instagram !== (clinic?.instagram || "")

  // Automation (FAQ / business info) state
  const [businessInfo, setBusinessInfo] = useState(clinic?.business_info || "")
  const [faq, setFaq] = useState(clinic?.faq || "")
  const [blockedIntentReply, setBlockedIntentReply] = useState(clinic?.settings?.ai_blocked_intent_reply || "")
  const [humanTakeoverHours, setHumanTakeoverHours] = useState<string>(
    clinic?.settings?.ai_human_takeover_pause_hours != null
      ? String(clinic.settings.ai_human_takeover_pause_hours)
      : ""
  )
  const [isSavingAutomation, setIsSavingAutomation] = useState(false)
  const automationChanged =
    businessInfo !== (clinic?.business_info || "") ||
    faq !== (clinic?.faq || "") ||
    blockedIntentReply !== (clinic?.settings?.ai_blocked_intent_reply || "") ||
    humanTakeoverHours !== (clinic?.settings?.ai_human_takeover_pause_hours != null
      ? String(clinic.settings.ai_human_takeover_pause_hours)
      : "")

  // User editing state
  const [userName, setUserName] = useState(user?.name || "")
  const [isSavingUser, setIsSavingUser] = useState(false)
  const userNameChanged = userName !== (user?.name || "")

  // Password reset state
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false)

  // Notification settings state
  const [whatsappReminders, setWhatsappReminders] = useState(
    clinic?.settings?.whatsapp_reminders_enabled ?? false
  )
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)

  // AI agent state
  const [aiAgentEnabled, setAiAgentEnabled] = useState(
    clinic?.settings?.ai_agent_enabled ?? false
  )
  const [isSavingAiAgent, setIsSavingAiAgent] = useState(false)

  // AI per-tool state (nil = default true; false explicitly disables)
  const [aiToolSchedule, setAiToolSchedule] = useState<boolean>(
    clinic?.settings?.ai_tool_schedule ?? true
  )
  const [aiToolConfirm, setAiToolConfirm] = useState<boolean>(
    clinic?.settings?.ai_tool_confirm ?? true
  )
  const [aiToolCancel, setAiToolCancel] = useState<boolean>(
    clinic?.settings?.ai_tool_cancel ?? true
  )
  const [aiToolReschedule, setAiToolReschedule] = useState<boolean>(
    clinic?.settings?.ai_tool_reschedule ?? true
  )
  const [aiToolEnrollClass, setAiToolEnrollClass] = useState<boolean>(
    clinic?.settings?.ai_tool_enroll_class ?? true
  )
  const [aiToolConfirmClass, setAiToolConfirmClass] = useState<boolean>(
    clinic?.settings?.ai_tool_confirm_class ?? true
  )
  const [isSavingAiTool, setIsSavingAiTool] = useState<string | null>(null)

  // Payment reminder (mensalidade) state. WhatsApp defaults to ON so new
  // clinics benefit without flipping anything; email stays opt-in because
  // unconfigured sender addresses bounce. Days-before defaults to 3.
  const [paymentReminderWhatsApp, setPaymentReminderWhatsApp] = useState<boolean>(
    clinic?.settings?.payment_reminder_whatsapp_enabled ?? true
  )
  const [paymentReminderEmail, setPaymentReminderEmail] = useState<boolean>(
    clinic?.settings?.payment_reminder_email_enabled ?? false
  )
  const [paymentReminderDays, setPaymentReminderDays] = useState<string>(
    clinic?.settings?.payment_reminder_days_before != null
      ? String(clinic.settings.payment_reminder_days_before)
      : "3"
  )
  const [isSavingPaymentReminder, setIsSavingPaymentReminder] = useState<string | null>(null)

  // Appointment confirmation reminders per window. Default ON (null from the
  // backend also treated as true) so existing clinics keep the full
  // 48h/24h/2h flow after the toggles were introduced.
  const [apptReminder2h, setApptReminder2h] = useState<boolean>(
    clinic?.settings?.whatsapp_reminder_2h_enabled ?? true
  )
  const [apptReminder24h, setApptReminder24h] = useState<boolean>(
    clinic?.settings?.whatsapp_reminder_24h_enabled ?? true
  )
  const [apptReminder48h, setApptReminder48h] = useState<boolean>(
    clinic?.settings?.whatsapp_reminder_48h_enabled ?? true
  )
  const [isSavingApptReminder, setIsSavingApptReminder] = useState<string | null>(null)

  // Group class reminder windows. Group plans (Pilates, etc.) never
  // materialize as appointments, so they have a separate reminder worker
  // and separate per-window flags. 48h is intentionally not offered —
  // weekly classes don't benefit from a 48h heads-up.
  const [classReminder24h, setClassReminder24h] = useState<boolean>(
    clinic?.settings?.group_class_reminder_24h_enabled ?? true
  )
  const [classReminder2h, setClassReminder2h] = useState<boolean>(
    clinic?.settings?.group_class_reminder_2h_enabled ?? true
  )
  const [isSavingClassReminder, setIsSavingClassReminder] = useState<string | null>(null)

  // Online booking state
  const [allowOnlineBooking, setAllowOnlineBooking] = useState(
    clinic?.settings?.allow_online_booking ?? false
  )
  const [isSavingOnlineBooking, setIsSavingOnlineBooking] = useState(false)

  // Calendar integration state (status only — full management lives in /configuracoes/integracoes/google-calendar)
  const [calendarIntegration, setCalendarIntegration] = useState<CalendarIntegration | null>(null)
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true)

  // Billing state (from faturamento)
  const [customer, setCustomer] = useState<BillingCustomer | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [pixQRCode, setPixQRCode] = useState<PixQRCode | null>(null)
  const [isLoadingPix, setIsLoadingPix] = useState(false)
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'professional' | 'advanced'>('professional')
  const [isSubscribing, setIsSubscribing] = useState(false)

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [newMethodName, setNewMethodName] = useState("")
  const [newMethodType, setNewMethodType] = useState<PaymentMethodType>("pix")
  const [isSavingMethod, setIsSavingMethod] = useState(false)
  const [showNewMethodForm, setShowNewMethodForm] = useState(false)

  // Marketplace state
  const [subaccount, setSubaccount] = useState<Subaccount | null>(null)
  const [isLoadingSubaccount, setIsLoadingSubaccount] = useState(true)
  const [isCreatingSubaccount, setIsCreatingSubaccount] = useState(false)
  const [showWalletId, setShowWalletId] = useState(false)
  const [mktCompanyName, setMktCompanyName] = useState("")
  const [mktCpfCnpj, setMktCpfCnpj] = useState("")
  const [mktCompanyType, setMktCompanyType] = useState("MEI")
  const [mktBirthDate, setMktBirthDate] = useState("")
  const [mktIncomeValue, setMktIncomeValue] = useState("")
  const [mktEmail, setMktEmail] = useState("")
  const [mktPhone, setMktPhone] = useState("")
  const [mktPostalCode, setMktPostalCode] = useState("")
  const [mktAddress, setMktAddress] = useState("")
  const [mktAddressNumber, setMktAddressNumber] = useState("")
  const [mktProvince, setMktProvince] = useState("")
  const [mktCity, setMktCity] = useState("")
  const [mktState, setMktState] = useState("")

  const loadPaymentMethods = useCallback(async () => {
    try {
      setIsLoadingPaymentMethods(true)
      const res = await api.getPaymentMethods()
      setPaymentMethods(res.data || [])
    } catch (err) {
      handleApiError(err, "Erro ao carregar metodos de pagamento")
    } finally {
      setIsLoadingPaymentMethods(false)
    }
  }, [])

  const handleCreateMethod = async () => {
    if (!newMethodName.trim()) return
    try {
      setIsSavingMethod(true)
      await api.createPaymentMethod({ name: newMethodName.trim(), type: newMethodType })
      showToast.success("Metodo de pagamento criado!")
      setNewMethodName("")
      setNewMethodType("pix")
      setShowNewMethodForm(false)
      loadPaymentMethods()
    } catch (err) {
      handleApiError(err, "Erro ao criar metodo de pagamento")
    } finally {
      setIsSavingMethod(false)
    }
  }

  const handleUpdateMethod = async (method: PaymentMethod) => {
    try {
      setIsSavingMethod(true)
      await api.updatePaymentMethod(method.id, { name: method.name, type: method.type, active: method.active })
      showToast.success("Metodo atualizado!")
      setEditingMethod(null)
      loadPaymentMethods()
    } catch (err) {
      handleApiError(err, "Erro ao atualizar metodo")
    } finally {
      setIsSavingMethod(false)
    }
  }

  const handleToggleMethod = async (method: PaymentMethod) => {
    try {
      await api.updatePaymentMethod(method.id, { active: !method.active })
      loadPaymentMethods()
    } catch (err) {
      handleApiError(err, "Erro ao atualizar metodo")
    }
  }

  const handleDeleteMethod = async (id: string) => {
    try {
      await api.deletePaymentMethod(id)
      showToast.success("Metodo removido!")
      loadPaymentMethods()
    } catch (err) {
      handleApiError(err, "Erro ao remover metodo")
    }
  }

  const paymentTypeLabels: Record<PaymentMethodType, string> = {
    pix: "PIX",
    credit: "Credito",
    debit: "Debito",
    cash: "Dinheiro",
    transfer: "Transferencia",
    other: "Outro",
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      document: '',
      phone: '',
      postal_code: '',
      address: '',
      address_number: '',
      province: '',
      city: '',
      state: '',
    },
  })

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  // OAuth callback lands here; forward to the detail page so the toast and state surface there.
  useEffect(() => {
    const calendarStatus = searchParams.get("calendar")
    if (calendarStatus !== "connected" && calendarStatus !== "error") return
    router.replace(
      `/${lng}/configuracoes/integracoes/google-calendar?calendar=${calendarStatus}`,
      { scroll: false },
    )
  }, [searchParams, router, lng])

  // Sync clinic name with store
  useEffect(() => {
    if (clinic?.name) {
      setClinicName(clinic.name)
    }
  }, [clinic?.name])

  // Sync user name with store
  useEffect(() => {
    if (user?.name) {
      setUserName(user.name)
    }
  }, [user?.name])

  // Sync notification settings with store
  useEffect(() => {
    if (clinic?.settings) {
      setWhatsappReminders(clinic.settings.whatsapp_reminders_enabled ?? false)
      setAiAgentEnabled(clinic.settings.ai_agent_enabled ?? false)
      setAllowOnlineBooking(clinic.settings.allow_online_booking ?? false)
      setAiToolSchedule(clinic.settings.ai_tool_schedule ?? true)
      setAiToolConfirm(clinic.settings.ai_tool_confirm ?? true)
      setAiToolCancel(clinic.settings.ai_tool_cancel ?? true)
      setAiToolReschedule(clinic.settings.ai_tool_reschedule ?? true)
      setAiToolEnrollClass(clinic.settings.ai_tool_enroll_class ?? true)
      setAiToolConfirmClass(clinic.settings.ai_tool_confirm_class ?? true)
      setClassReminder24h(clinic.settings.group_class_reminder_24h_enabled ?? true)
      setClassReminder2h(clinic.settings.group_class_reminder_2h_enabled ?? true)
      setBlockedIntentReply(clinic.settings.ai_blocked_intent_reply || "")
      setHumanTakeoverHours(
        clinic.settings.ai_human_takeover_pause_hours != null
          ? String(clinic.settings.ai_human_takeover_pause_hours)
          : ""
      )
      setPaymentReminderWhatsApp(clinic.settings.payment_reminder_whatsapp_enabled ?? true)
      setPaymentReminderEmail(clinic.settings.payment_reminder_email_enabled ?? false)
      setPaymentReminderDays(
        clinic.settings.payment_reminder_days_before != null
          ? String(clinic.settings.payment_reminder_days_before)
          : "3"
      )
      setApptReminder2h(clinic.settings.whatsapp_reminder_2h_enabled ?? true)
      setApptReminder24h(clinic.settings.whatsapp_reminder_24h_enabled ?? true)
      setApptReminder48h(clinic.settings.whatsapp_reminder_48h_enabled ?? true)
    }
  }, [clinic?.settings])

  // Sync clinic contact/profile fields with store
  useEffect(() => {
    setPhone(clinic?.phone || "")
    setDoc(clinic?.document || "")
    setAddress(clinic?.address || "")
    setCity(clinic?.city || "")
    setUf(clinic?.state || "")
    setZipCode(clinic?.zip_code || "")
    setInstagram(clinic?.instagram || "")
    setBusinessInfo(clinic?.business_info || "")
    setFaq(clinic?.faq || "")
  }, [clinic?.phone, clinic?.document, clinic?.address, clinic?.city, clinic?.state, clinic?.zip_code, clinic?.instagram, clinic?.business_info, clinic?.faq])

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue)
    const current = searchParams.get("tab")
    if (current !== value) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("tab", value)
      router.replace(`/${lng}/configuracoes?${params.toString()}`, { scroll: false })
    }
  }, [searchParams, router, lng])

  // Keep state in sync if the user navigates via back/forward
  useEffect(() => {
    const t = searchParams.get("tab")
    if (t && (VALID_TABS as readonly string[]).includes(t) && t !== activeTab) {
      setActiveTab(t as TabValue)
    }
  }, [searchParams, activeTab])

  const canEditClinic = user?.role === "admin" || user?.role === "owner"

  // Clinic handlers
  const handleSaveClinicName = async () => {
    if (!clinicName.trim() || !clinicNameChanged) return

    try {
      setIsSavingClinic(true)
      const updatedClinic = await api.updateClinic({ name: clinicName.trim() })
      setClinic(updatedClinic)
      showToast.success("Nome da clinica atualizado com sucesso")
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSavingClinic(false)
    }
  }

  const handleCancelClinicEdit = () => {
    setClinicName(clinic?.name || "")
  }

  const handleSaveContactInfo = async () => {
    if (!contactChanged) return
    try {
      setIsSavingContact(true)
      const updatedClinic = await api.updateClinic({
        phone: phone.trim(),
        document: doc.trim(),
        address: address.trim(),
        city: city.trim(),
        state: uf.trim(),
        zip_code: zipCode.trim(),
        instagram: instagram.trim(),
      })
      setClinic(updatedClinic)
      showToast.success("Dados da clinica atualizados")
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSavingContact(false)
    }
  }

  const handleCancelContactEdit = () => {
    setPhone(clinic?.phone || "")
    setDoc(clinic?.document || "")
    setAddress(clinic?.address || "")
    setCity(clinic?.city || "")
    setUf(clinic?.state || "")
    setZipCode(clinic?.zip_code || "")
    setInstagram(clinic?.instagram || "")
  }

  const handleSaveAutomation = async () => {
    if (!automationChanged) return
    try {
      setIsSavingAutomation(true)
      const parsedPause = humanTakeoverHours.trim() === "" ? null : Number(humanTakeoverHours)
      const pauseValue =
        parsedPause != null && Number.isFinite(parsedPause) && parsedPause >= 0 ? parsedPause : null
      const updatedClinic = await api.updateClinic({
        business_info: businessInfo,
        faq: faq,
        settings: {
          ...clinic?.settings,
          ai_blocked_intent_reply: blockedIntentReply,
          ai_human_takeover_pause_hours: pauseValue,
        },
      })
      setClinic(updatedClinic)
      showToast.success("Automacao atualizada")
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSavingAutomation(false)
    }
  }

  const handleCancelAutomationEdit = () => {
    setBusinessInfo(clinic?.business_info || "")
    setFaq(clinic?.faq || "")
    setBlockedIntentReply(clinic?.settings?.ai_blocked_intent_reply || "")
    setHumanTakeoverHours(
      clinic?.settings?.ai_human_takeover_pause_hours != null
        ? String(clinic.settings.ai_human_takeover_pause_hours)
        : ""
    )
  }

  // User handlers
  const handleSaveUserName = async () => {
    if (!userName.trim() || !userNameChanged || !user?.id) return

    try {
      setIsSavingUser(true)
      await api.updateUser(user.id, { name: userName.trim() })
      await api.getCurrentUser().then((data) => {
        useAuthStore.getState().setUser(data.user, data.clinic)
      })
      showToast.success("Nome atualizado com sucesso")
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSavingUser(false)
    }
  }

  const handleCancelUserEdit = () => {
    setUserName(user?.name || "")
  }

  // Notification handlers
  const handleToggleWhatsappReminders = async (enabled: boolean) => {
    if (!canEditClinic) return

    try {
      setIsSavingNotifications(true)
      setWhatsappReminders(enabled)
      const updatedClinic = await api.updateClinic({
        settings: {
          ...clinic?.settings,
          whatsapp_reminders_enabled: enabled,
        },
      })
      setClinic(updatedClinic)
      showToast.success(enabled ? "Lembretes WhatsApp ativados" : "Lembretes WhatsApp desativados")
    } catch (err) {
      setWhatsappReminders(!enabled)
      handleApiError(err)
    } finally {
      setIsSavingNotifications(false)
    }
  }

  // Payment reminder handlers. Saves immediately on toggle so the UX matches
  // the surrounding notification switches. The days-before input is debounced
  // via a blur handler instead to avoid firing on every keystroke.
  const handleTogglePaymentReminderWhatsApp = async (enabled: boolean) => {
    if (!canEditClinic) return
    try {
      setIsSavingPaymentReminder("whatsapp")
      setPaymentReminderWhatsApp(enabled)
      const updatedClinic = await api.updateClinic({
        settings: {
          ...clinic?.settings,
          payment_reminder_whatsapp_enabled: enabled,
        },
      })
      setClinic(updatedClinic)
      showToast.success(enabled ? "Lembrete de mensalidade por WhatsApp ativado" : "Lembrete de mensalidade por WhatsApp desativado")
    } catch (err) {
      setPaymentReminderWhatsApp(!enabled)
      handleApiError(err)
    } finally {
      setIsSavingPaymentReminder(null)
    }
  }

  const handleTogglePaymentReminderEmail = async (enabled: boolean) => {
    if (!canEditClinic) return
    try {
      setIsSavingPaymentReminder("email")
      setPaymentReminderEmail(enabled)
      const updatedClinic = await api.updateClinic({
        settings: {
          ...clinic?.settings,
          payment_reminder_email_enabled: enabled,
        },
      })
      setClinic(updatedClinic)
      showToast.success(enabled ? "Lembrete de mensalidade por email ativado" : "Lembrete de mensalidade por email desativado")
    } catch (err) {
      setPaymentReminderEmail(!enabled)
      handleApiError(err)
    } finally {
      setIsSavingPaymentReminder(null)
    }
  }

  const handleSavePaymentReminderDays = async () => {
    if (!canEditClinic) return
    const n = parseInt(paymentReminderDays, 10)
    if (isNaN(n) || n < 1 || n > 7) {
      showToast.error("Informe um valor entre 1 e 7 dias")
      setPaymentReminderDays(
        clinic?.settings?.payment_reminder_days_before != null
          ? String(clinic.settings.payment_reminder_days_before)
          : "3"
      )
      return
    }
    // No-op if unchanged — avoids writing identical values on every blur.
    if (n === (clinic?.settings?.payment_reminder_days_before ?? 3)) return
    try {
      setIsSavingPaymentReminder("days")
      const updatedClinic = await api.updateClinic({
        settings: {
          ...clinic?.settings,
          payment_reminder_days_before: n,
        },
      })
      setClinic(updatedClinic)
      showToast.success("Dias antes do vencimento atualizado")
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSavingPaymentReminder(null)
    }
  }

  // Toggle a single appointment reminder window (2h/24h/48h). One handler for
  // all three windows — each switch passes its key so we don't triplicate the
  // try/catch/optimistic-rollback pattern.
  const handleToggleAppointmentReminder = async (
    window: "2h" | "24h" | "48h",
    enabled: boolean,
  ) => {
    if (!canEditClinic) return
    const setters: Record<typeof window, (v: boolean) => void> = {
      "2h": setApptReminder2h,
      "24h": setApptReminder24h,
      "48h": setApptReminder48h,
    }
    const labels: Record<typeof window, string> = {
      "2h": "2 horas antes",
      "24h": "24 horas antes",
      "48h": "48 horas antes",
    }
    const settingsKey = {
      "2h": "whatsapp_reminder_2h_enabled",
      "24h": "whatsapp_reminder_24h_enabled",
      "48h": "whatsapp_reminder_48h_enabled",
    }[window]
    try {
      setIsSavingApptReminder(window)
      setters[window](enabled)
      const updatedClinic = await api.updateClinic({
        settings: {
          ...clinic?.settings,
          [settingsKey]: enabled,
        },
      })
      setClinic(updatedClinic)
      showToast.success(
        enabled
          ? `Lembrete ${labels[window]} ativado`
          : `Lembrete ${labels[window]} desativado`,
      )
    } catch (err) {
      setters[window](!enabled)
      handleApiError(err)
    } finally {
      setIsSavingApptReminder(null)
    }
  }

  const handleToggleAIAgent = async (enabled: boolean) => {
    if (!canEditClinic) return

    try {
      setIsSavingAiAgent(true)
      setAiAgentEnabled(enabled)
      const updatedClinic = await api.updateClinic({
        settings: {
          ...clinic?.settings,
          ai_agent_enabled: enabled,
        },
      })
      setClinic(updatedClinic)
      showToast.success(enabled ? "Atendimento por IA ativado" : "Atendimento por IA desativado")
    } catch (err) {
      setAiAgentEnabled(!enabled)
      handleApiError(err)
    } finally {
      setIsSavingAiAgent(false)
    }
  }

  type AITool = "schedule" | "confirm" | "cancel" | "reschedule" | "enroll_class" | "confirm_class"

  const handleToggleAITool = async (tool: AITool, enabled: boolean) => {
    if (!canEditClinic) return

    const setters: Record<AITool, (v: boolean) => void> = {
      schedule: setAiToolSchedule,
      confirm: setAiToolConfirm,
      cancel: setAiToolCancel,
      reschedule: setAiToolReschedule,
      enroll_class: setAiToolEnrollClass,
      confirm_class: setAiToolConfirmClass,
    }
    const apiKey: Record<AITool, keyof ClinicSettings> = {
      schedule: "ai_tool_schedule",
      confirm: "ai_tool_confirm",
      cancel: "ai_tool_cancel",
      reschedule: "ai_tool_reschedule",
      enroll_class: "ai_tool_enroll_class",
      confirm_class: "ai_tool_confirm_class",
    }

    const setter = setters[tool]
    setter(enabled)
    setIsSavingAiTool(tool)
    try {
      const updatedClinic = await api.updateClinic({
        settings: {
          ...clinic?.settings,
          [apiKey[tool]]: enabled,
        },
      })
      setClinic(updatedClinic)
    } catch (err) {
      setter(!enabled)
      handleApiError(err)
    } finally {
      setIsSavingAiTool(null)
    }
  }

  // Toggle a single group class reminder window (24h/2h). Mirrors
  // handleToggleAppointmentReminder but for the separate class worker —
  // group plans never materialize as appointments, so the per-window flags
  // must be independent.
  const handleToggleClassReminder = async (window: "24h" | "2h", enabled: boolean) => {
    if (!canEditClinic) return
    const setters: Record<typeof window, (v: boolean) => void> = {
      "24h": setClassReminder24h,
      "2h": setClassReminder2h,
    }
    const labels: Record<typeof window, string> = {
      "24h": "24 horas antes",
      "2h": "2 horas antes",
    }
    const settingsKey: Record<typeof window, keyof ClinicSettings> = {
      "24h": "group_class_reminder_24h_enabled",
      "2h": "group_class_reminder_2h_enabled",
    }
    try {
      setIsSavingClassReminder(window)
      setters[window](enabled)
      const updatedClinic = await api.updateClinic({
        settings: {
          ...clinic?.settings,
          [settingsKey[window]]: enabled,
        },
      })
      setClinic(updatedClinic)
      showToast.success(
        enabled
          ? `Lembrete de aula ${labels[window]} ativado`
          : `Lembrete de aula ${labels[window]} desativado`,
      )
    } catch (err) {
      setters[window](!enabled)
      handleApiError(err)
    } finally {
      setIsSavingClassReminder(null)
    }
  }

  const handleToggleOnlineBooking = async (enabled: boolean) => {
    if (!canEditClinic) return

    try {
      setIsSavingOnlineBooking(true)
      setAllowOnlineBooking(enabled)
      const updatedClinic = await api.updateClinic({
        settings: {
          ...clinic?.settings,
          allow_online_booking: enabled,
        },
      })
      setClinic(updatedClinic)
      showToast.success(enabled ? "Agendamento online ativado" : "Agendamento online desativado")
    } catch (err) {
      setAllowOnlineBooking(!enabled)
      handleApiError(err)
    } finally {
      setIsSavingOnlineBooking(false)
    }
  }

  const handleRequestPasswordReset = async () => {
    if (!user?.email) return

    try {
      setIsSendingPasswordReset(true)
      await api.forgotPassword(user.email)
      showToast.success("Email enviado! Verifique sua caixa de entrada para alterar sua senha.")
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSendingPasswordReset(false)
    }
  }

  // Fetch clinic data
  const fetchClinicData = useCallback(async () => {
    try {
      const data = await api.getClinic()
      setClinic(data)
    } catch {
      // Keep existing data if fetch fails
    }
  }, [setClinic])

  useEffect(() => {
    fetchClinicData()
  }, [fetchClinicData])

  const fetchCalendarIntegration = useCallback(async () => {
    try {
      setIsLoadingCalendar(true)
      const data = await api.getCalendarIntegration()
      setCalendarIntegration(data)
    } catch {
      setCalendarIntegration(null)
    } finally {
      setIsLoadingCalendar(false)
    }
  }, [])

  useEffect(() => {
    fetchCalendarIntegration()
  }, [fetchCalendarIntegration])

  useEffect(() => {
    loadPaymentMethods()
  }, [loadPaymentMethods])

  // Marketplace functions
  const loadSubaccount = useCallback(async () => {
    try {
      setIsLoadingSubaccount(true)
      const data = await api.getMarketplaceSubaccount()
      setSubaccount(data)
    } catch {
      setSubaccount(null)
    } finally {
      setIsLoadingSubaccount(false)
    }
  }, [])

  useEffect(() => {
    loadSubaccount()
  }, [loadSubaccount])

  const handleCreateSubaccount = async () => {
    if (!mktCompanyName.trim() || !mktCpfCnpj.trim() || !mktEmail.trim() || !mktIncomeValue) return
    try {
      setIsCreatingSubaccount(true)
      const data = await api.createMarketplaceSubaccount({
        company_name: mktCompanyName.trim(),
        cpf_cnpj: mktCpfCnpj.replace(/[^\d]/g, ""),
        company_type: mktCompanyType,
        birth_date: mktBirthDate || undefined,
        income_value: parseFloat(mktIncomeValue.replace(/\./g, "").replace(",", ".")),
        email: mktEmail.trim(),
        phone: mktPhone.replace(/[^\d]/g, "") || undefined,
        mobile_phone: mktPhone.replace(/[^\d]/g, "") || undefined,
        postal_code: mktPostalCode.replace(/[^\d]/g, "") || undefined,
        address: mktAddress.trim() || undefined,
        address_number: mktAddressNumber.trim() || undefined,
        province: mktProvince.trim() || undefined,
        city: mktCity.trim() || undefined,
        state: mktState.trim() || undefined,
      })
      setSubaccount(data)
      showToast.success("Conta financeira criada com sucesso!")
    } catch (err) {
      handleApiError(err, "Erro ao criar conta financeira")
    } finally {
      setIsCreatingSubaccount(false)
    }
  }

  // Billing handlers (from faturamento)
  const fetchCustomer = useCallback(async () => {
    try {
      setIsLoadingCustomer(true)
      const data = await api.getBillingCustomer()
      setCustomer(data)
    } catch {
      setCustomer(null)
    } finally {
      setIsLoadingCustomer(false)
    }
  }, [])

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoadingSubscription(true)
      const data = await api.getSubscription()
      setSubscription(data)
    } catch {
      setSubscription(null)
    } finally {
      setIsLoadingSubscription(false)
    }
  }, [])

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoadingPayments(true)
      const data = await api.getPayments(1, 10)
      setPayments(data.data || [])
    } catch {
      setPayments([])
    } finally {
      setIsLoadingPayments(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomer()
    fetchSubscription()
    fetchPayments()
  }, [fetchCustomer, fetchSubscription, fetchPayments])

  const onSubmitCustomer = async (data: CustomerFormData) => {
    try {
      setIsCreatingCustomer(true)
      const result = await api.createBillingCustomer(data)
      setCustomer(result)
      setShowCustomerForm(false)
      showToast.success('Dados de cobranca cadastrados com sucesso!')
      reset()
    } catch (err) {
      handleApiError(err, 'Erro ao cadastrar dados de cobranca')
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  const handleSubscribe = async () => {
    try {
      setIsSubscribing(true)
      await api.createSubscription({
        plan: selectedPlan,
        billing_type: 'PIX',
        cycle: 'MONTHLY'
      })
      showToast.success('Assinatura criada com sucesso!')
      setShowPlanDialog(false)
      fetchSubscription()
      fetchPayments()
    } catch (err) {
      handleApiError(err, 'Erro ao criar assinatura')
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleViewPix = async (payment: Payment) => {
    setIsLoadingPix(true)
    try {
      const data = await api.getPaymentPixQRCode(payment.id)
      setPixQRCode(data)
    } catch {
      setPixQRCode(null)
      showToast.error('Erro ao carregar QR Code')
    } finally {
      setIsLoadingPix(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const subscriptionLabels: Record<string, string> = {
    trial: "Periodo de Teste",
    active: "Ativa",
    pending: "Aguardando Pagamento",
    past_due: "Pagamento Atrasado",
    canceled: "Cancelada",
    expired: "Expirada",
  }

  const subscriptionVariants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
    trial: "info",
    active: "success",
    pending: "warning",
    past_due: "warning",
    canceled: "destructive",
    expired: "destructive",
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Configuracoes" tutorialPage="configuracoes" />

      <div className="flex-1 overflow-hidden min-h-0 bg-muted/10">
        <div className="mx-auto h-full flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="bg-background px-4 md:px-8 pt-2 border-b border-border/40 shrink-0">
              <TabsList className="flex h-12 w-full justify-start gap-4 md:gap-6 bg-transparent p-0 overflow-x-auto no-scrollbar">
                <TabsTrigger 
                  value="clinica" 
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Clinica</span>
                </TabsTrigger>
                <TabsTrigger
                  value="automacao"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Automacao</span>
                </TabsTrigger>
                {canEditClinic && (
                  <TabsTrigger 
                    value="anamnese" 
                    className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex items-center gap-2 whitespace-nowrap"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Anamnese</span>
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="integracoes" 
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Integrações</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="assinatura" 
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Assinatura</span>
                </TabsTrigger>
                <TabsTrigger
                  value="pagamentos"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <Wallet className="h-4 w-4" />
                  <span className="hidden sm:inline">Pagamentos</span>
                </TabsTrigger>
                <TabsTrigger
                  value="financeiro"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <Store className="h-4 w-4" />
                  <span className="hidden sm:inline">Financeiro</span>
                </TabsTrigger>
                <TabsTrigger
                  value="conta"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Conta</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-4 md:p-8 mt-0 min-h-0">
              {/* Tab: Clinica */}
              <TabsContent value="clinica" className="mt-0 outline-none space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Clinica</CardTitle>
                  <CardDescription>Informacoes basicas sobre sua clinica</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinic_name">Nome da Clinica</Label>
                    <div className="flex gap-2">
                      <Input
                        id="clinic_name"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        disabled={!canEditClinic || isSavingClinic}
                        className={!canEditClinic ? "bg-muted" : ""}
                      />
                      {canEditClinic && clinicNameChanged && (
                        <>
                          <Button size="sm" onClick={handleSaveClinicName} disabled={isSavingClinic}>
                            {isSavingClinic ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelClinicEdit} disabled={isSavingClinic}>
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic_slug">Identificador</Label>
                    <Input id="clinic_slug" value={clinic?.slug || ""} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">O identificador nao pode ser alterado.</p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Agendamento Online</Label>
                      <p className="text-sm text-muted-foreground">Permitir que pacientes agendem consultas pelo link publico</p>
                    </div>
                    <Switch
                      checked={allowOnlineBooking}
                      onCheckedChange={handleToggleOnlineBooking}
                      disabled={!canEditClinic || isSavingOnlineBooking}
                    />
                  </div>

                  {allowOnlineBooking && clinic?.booking_url && (
                    <div className="space-y-2">
                      <Label htmlFor="booking_url">Link de Agendamento Online</Label>
                      <div className="flex gap-2">
                        <Input id="booking_url" value={clinic.booking_url} readOnly className="bg-muted" />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            if (clinic.booking_url) {
                              navigator.clipboard.writeText(clinic.booking_url)
                              showToast.success("Link copiado!")
                            }
                          }}
                          title="Copiar link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => window.open(clinic.booking_url, "_blank")}
                          title="Abrir link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Compartilhe este link com seus pacientes para agendamento online.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contato e Localizacao</CardTitle>
                  <CardDescription>Dados de contato e endereco da clinica</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clinic_phone">Telefone</Label>
                      <Input
                        id="clinic_phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        disabled={!canEditClinic || isSavingContact}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinic_document">CNPJ / CPF</Label>
                      <Input
                        id="clinic_document"
                        value={doc}
                        onChange={(e) => setDoc(e.target.value)}
                        placeholder="00.000.000/0000-00"
                        disabled={!canEditClinic || isSavingContact}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinic_instagram">Instagram</Label>
                      <Input
                        id="clinic_instagram"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@suaclinica"
                        disabled={!canEditClinic || isSavingContact}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinic_zip">CEP</Label>
                      <Input
                        id="clinic_zip"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="00000-000"
                        disabled={!canEditClinic || isSavingContact}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="clinic_address">Endereco</Label>
                      <Input
                        id="clinic_address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Rua, numero, complemento"
                        disabled={!canEditClinic || isSavingContact}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinic_city">Cidade</Label>
                      <Input
                        id="clinic_city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={!canEditClinic || isSavingContact}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinic_state">Estado (UF)</Label>
                      <Input
                        id="clinic_state"
                        value={uf}
                        onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="SP"
                        maxLength={2}
                        disabled={!canEditClinic || isSavingContact}
                      />
                    </div>
                  </div>

                  {canEditClinic && contactChanged && (
                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="outline" onClick={handleCancelContactEdit} disabled={isSavingContact}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveContactInfo} disabled={isSavingContact}>
                        {isSavingContact ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                        Salvar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Automacao (lembretes + IA + FAQ) */}
            <TabsContent value="automacao" className="mt-0 outline-none space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notificacoes</CardTitle>
                  <CardDescription>Configure as notificacoes automaticas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Lembretes</p>
                        <p className="text-sm text-muted-foreground">Enviar lembretes automáticos (consultas e mensalidades) via WhatsApp e Email</p>
                      </div>
                      <Switch
                        checked={whatsappReminders}
                        onCheckedChange={handleToggleWhatsappReminders}
                        disabled={isSavingNotifications || !canEditClinic}
                      />
                    </div>

                    {whatsappReminders && (
                      <div className="ml-4 pl-4 border-l-2 border-muted space-y-4">
                        <p className="text-xs text-muted-foreground">
                          Confirmação de consulta: o paciente recebe um lembrete pelo WhatsApp antes da consulta agendada. Você pode desativar cada janela individualmente (48h, 24h, 2h antes).
                        </p>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Lembrete 48 horas antes</p>
                            <p className="text-xs text-muted-foreground">Mandado 48 horas antes da consulta. Útil para dar tempo do paciente se organizar.</p>
                          </div>
                          <Switch
                            checked={apptReminder48h}
                            onCheckedChange={(v) => handleToggleAppointmentReminder("48h", v)}
                            disabled={isSavingApptReminder === "48h" || !canEditClinic}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Lembrete 24 horas antes</p>
                            <p className="text-xs text-muted-foreground">Mandado 24 horas antes da consulta. É o lembrete mais usado.</p>
                          </div>
                          <Switch
                            checked={apptReminder24h}
                            onCheckedChange={(v) => handleToggleAppointmentReminder("24h", v)}
                            disabled={isSavingApptReminder === "24h" || !canEditClinic}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Lembrete 2 horas antes</p>
                            <p className="text-xs text-muted-foreground">Mandado 2 horas antes da consulta, para confirmação de última hora.</p>
                          </div>
                          <Switch
                            checked={apptReminder2h}
                            onCheckedChange={(v) => handleToggleAppointmentReminder("2h", v)}
                            disabled={isSavingApptReminder === "2h" || !canEditClinic}
                          />
                        </div>

                        <Separator />

                        <p className="text-xs text-muted-foreground">
                          Lembrete de aulas em grupo (Pilates, etc): enviado para alunos matriculados em turma, antes da próxima aula. Independente do lembrete de consulta acima — turmas em grupo não geram appointment individual, então usam um fluxo separado.
                        </p>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Lembrete de aula 24 horas antes</p>
                            <p className="text-xs text-muted-foreground">Pede ao aluno para confirmar presença na próxima aula da turma. A resposta &quot;sim&quot; é processada automaticamente pela IA.</p>
                          </div>
                          <Switch
                            checked={classReminder24h}
                            onCheckedChange={(v) => handleToggleClassReminder("24h", v)}
                            disabled={isSavingClassReminder === "24h" || !canEditClinic}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Lembrete de aula 2 horas antes</p>
                            <p className="text-xs text-muted-foreground">Aviso curto de última hora (&quot;sua aula é hoje às HH:MM, te esperamos&quot;), sem pedir confirmação.</p>
                          </div>
                          <Switch
                            checked={classReminder2h}
                            onCheckedChange={(v) => handleToggleClassReminder("2h", v)}
                            disabled={isSavingClassReminder === "2h" || !canEditClinic}
                          />
                        </div>

                        <Separator />

                        <p className="text-xs text-muted-foreground">
                          Lembrete de mensalidade: enviado para alunos com plano mensal (individual ou em grupo) alguns dias antes do vencimento, apenas quando o pagamento ainda não foi registrado no sistema.
                        </p>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Lembrete de mensalidade por WhatsApp</p>
                            <p className="text-xs text-muted-foreground">Avisa o aluno pelo WhatsApp antes do vencimento da mensalidade.</p>
                          </div>
                          <Switch
                            checked={paymentReminderWhatsApp}
                            onCheckedChange={handleTogglePaymentReminderWhatsApp}
                            disabled={isSavingPaymentReminder === "whatsapp" || !canEditClinic}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Lembrete de mensalidade por Email</p>
                            <p className="text-xs text-muted-foreground">Envia um e-mail de cobrança antes do vencimento da mensalidade.</p>
                          </div>
                          <Switch
                            checked={paymentReminderEmail}
                            onCheckedChange={handleTogglePaymentReminderEmail}
                            disabled={isSavingPaymentReminder === "email" || !canEditClinic}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payment_reminder_days_before">Dias antes do vencimento</Label>
                          <Input
                            id="payment_reminder_days_before"
                            type="number"
                            min={1}
                            max={7}
                            value={paymentReminderDays}
                            onChange={(e) => setPaymentReminderDays(e.target.value)}
                            onBlur={handleSavePaymentReminderDays}
                            disabled={!canEditClinic || isSavingPaymentReminder === "days"}
                          />
                          <p className="text-xs text-muted-foreground">
                            Quantos dias antes da data de vencimento o lembrete deve ser enviado. Permitido: 1 a 7.
                          </p>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Agendamento automatico</p>
                        <p className="text-sm text-muted-foreground">Permitir que pacientes marquem consultas automaticamente pela IA</p>
                      </div>
                      <Switch
                        checked={aiAgentEnabled}
                        onCheckedChange={handleToggleAIAgent}
                        disabled={isSavingAiAgent || !canEditClinic}
                      />
                    </div>

                    {aiAgentEnabled && (
                      <div className="ml-4 pl-4 border-l-2 border-muted space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Escolha quais acoes a IA pode executar. Quando uma acao esta desligada, a IA responde &quot;Pode aguardar um minutinho? Alguem do nosso time vai te atender em breve.&quot; e a clinica cuida manualmente.
                        </p>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Marcar novas consultas</p>
                            <p className="text-xs text-muted-foreground">IA pode agendar consultas novas com pacientes</p>
                          </div>
                          <Switch
                            checked={aiToolSchedule}
                            onCheckedChange={(v) => handleToggleAITool("schedule", v)}
                            disabled={isSavingAiTool === "schedule" || !canEditClinic}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Confirmar agendamentos</p>
                            <p className="text-xs text-muted-foreground">IA pode processar confirmacoes de consultas</p>
                          </div>
                          <Switch
                            checked={aiToolConfirm}
                            onCheckedChange={(v) => handleToggleAITool("confirm", v)}
                            disabled={isSavingAiTool === "confirm" || !canEditClinic}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Cancelar agendamentos</p>
                            <p className="text-xs text-muted-foreground">IA pode cancelar consultas a pedido do paciente</p>
                          </div>
                          <Switch
                            checked={aiToolCancel}
                            onCheckedChange={(v) => handleToggleAITool("cancel", v)}
                            disabled={isSavingAiTool === "cancel" || !canEditClinic}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Remarcar agendamentos</p>
                            <p className="text-xs text-muted-foreground">IA pode reagendar consultas existentes</p>
                          </div>
                          <Switch
                            checked={aiToolReschedule}
                            onCheckedChange={(v) => handleToggleAITool("reschedule", v)}
                            disabled={isSavingAiTool === "reschedule" || !canEditClinic}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Matricular em turma (Pilates etc.)</p>
                            <p className="text-xs text-muted-foreground">IA pode matricular o aluno numa turma em grupo apos coletar frequencia, dias e convenio. Quando desligado, a IA coleta as informacoes e transfere pro time humano confirmar a matricula.</p>
                          </div>
                          <Switch
                            checked={aiToolEnrollClass}
                            onCheckedChange={(v) => handleToggleAITool("enroll_class", v)}
                            disabled={isSavingAiTool === "enroll_class" || !canEditClinic}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Confirmar presenca em aula de turma</p>
                            <p className="text-xs text-muted-foreground">IA pode confirmar a participacao do aluno na proxima aula da turma. Independente da confirmacao de consulta individual acima.</p>
                          </div>
                          <Switch
                            checked={aiToolConfirmClass}
                            onCheckedChange={(v) => handleToggleAITool("confirm_class", v)}
                            disabled={isSavingAiTool === "confirm_class" || !canEditClinic}
                          />
                        </div>

                        <div className="space-y-2 pt-2">
                          <Label htmlFor="ai_blocked_intent_reply">Mensagem quando a IA nao pode atender</Label>
                          <Textarea
                            id="ai_blocked_intent_reply"
                            value={blockedIntentReply}
                            onChange={(e) => setBlockedIntentReply(e.target.value)}
                            placeholder="Pode aguardar um minutinho? Alguem do nosso time vai te atender em breve."
                            rows={3}
                            disabled={!canEditClinic || isSavingAutomation}
                          />
                          <p className="text-xs text-muted-foreground">
                            Enviada quando o paciente pede uma acao desligada acima. Se vazio, usa o texto padrao.
                          </p>
                        </div>

                        <div className="space-y-2 pt-2">
                          <Label htmlFor="ai_human_takeover_pause_hours">Pausar IA apos atendimento humano (horas)</Label>
                          <Input
                            id="ai_human_takeover_pause_hours"
                            type="number"
                            min={0}
                            value={humanTakeoverHours}
                            onChange={(e) => setHumanTakeoverHours(e.target.value)}
                            placeholder="4"
                            disabled={!canEditClinic || isSavingAutomation}
                          />
                          <p className="text-xs text-muted-foreground">
                            Quando alguem da clinica responde pelo WhatsApp direto (sem passar pelo sistema), a IA para de responder por X horas. Vazio usa 4h padrao. 0 desativa a pausa.
                          </p>
                        </div>
                      </div>
                    )}

                    {!canEditClinic && (
                      <p className="text-xs text-muted-foreground">
                        Apenas administradores podem alterar as configuracoes de notificacao.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Base de conhecimento da IA</CardTitle>
                  <CardDescription>
                    Informacoes que a IA usa para responder pacientes no WhatsApp. Se algum campo estiver vazio, a IA simplesmente nao tera essa informacao.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinic_business_info">Informacoes da clinica</Label>
                    <Textarea
                      id="clinic_business_info"
                      value={businessInfo}
                      onChange={(e) => setBusinessInfo(e.target.value)}
                      placeholder="Ex: Atendemos apenas particular. Aceitamos Pix, cartao e boleto. Estacionamento gratuito. Horario de atendimento: Seg a Sex, 8h as 18h."
                      rows={5}
                      disabled={!canEditClinic || isSavingAutomation}
                    />
                    <p className="text-xs text-muted-foreground">
                      Dados operacionais/comerciais da clinica que a IA deve conhecer.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic_faq">Duvidas frequentes (FAQ)</Label>
                    <Textarea
                      id="clinic_faq"
                      value={faq}
                      onChange={(e) => setFaq(e.target.value)}
                      placeholder={"Ex:\nP: Quanto tempo dura a sessao?\nR: 50 minutos.\n\nP: Posso remarcar?\nR: Sim, ate 24h antes."}
                      rows={8}
                      disabled={!canEditClinic || isSavingAutomation}
                    />
                    <p className="text-xs text-muted-foreground">
                      Perguntas e respostas que a IA deve usar como referencia.
                    </p>
                  </div>

                  {canEditClinic && automationChanged && (
                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="outline" onClick={handleCancelAutomationEdit} disabled={isSavingAutomation}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveAutomation} disabled={isSavingAutomation}>
                        {isSavingAutomation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                        Salvar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Integracoes */}
            <TabsContent value="integracoes" className="mt-0 outline-none">
              <div className="space-y-7">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold tracking-tight">Integrações</h2>
                  <p className="text-sm text-muted-foreground">
                    Conecte ferramentas externas para automatizar e ampliar sua clínica.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/${lng}/configuracoes/integracoes/google-calendar`)
                    }
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{
                        background:
                          "radial-gradient(70% 80% at 100% 0%, rgba(66,133,244,0.07), transparent 60%), radial-gradient(60% 70% at 0% 100%, rgba(234,67,53,0.04), transparent 60%)",
                      }}
                    />

                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)] ring-1 ring-border">
                        <GoogleCalendarLogo className="h-10 w-10" />
                      </div>

                      <div className="flex items-center gap-2">
                        {isLoadingCalendar ? (
                          <span className="inline-flex h-6 w-24 animate-pulse rounded-full bg-muted" />
                        ) : calendarIntegration?.connected ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </span>
                            Conectado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                            Não conectado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative mt-5 space-y-1.5">
                      <h3 className="text-lg font-semibold tracking-tight">Google Calendar</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Sincronize automaticamente os agendamentos da clínica com a sua agenda do Google.
                      </p>
                    </div>

                    <div className="relative mt-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      {calendarIntegration?.connected ? "Gerenciar" : "Configurar"}
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Anamnese */}
            {canEditClinic && (
              <TabsContent value="anamnese" className="mt-0 outline-none space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Layout className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Modelos de Anamnese</CardTitle>
                    </div>
                    <CardDescription>Personalize as fichas clinicas para os seus atendimentos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/30 rounded-lg p-6 text-center space-y-4">
                      <div className="max-w-md mx-auto space-y-2">
                        <p className="text-sm font-medium">Crie fichas personalizadas por especialidade</p>
                        <p className="text-xs text-muted-foreground">
                          Adicione campos de texto, escalas de dor, selecao multipla e organize a ordem que melhor funciona para sua clinica.
                        </p>
                      </div>
                      <Button onClick={() => router.push(`/${lng}/configuracoes/anamnese`)}>
                        Gerenciar Modelos de Ficha
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Tab: Assinatura */}
            <TabsContent value="assinatura" className="mt-0 outline-none">
              <div className="max-w-[680px] mx-auto flex flex-col gap-5 pt-2 pb-10 font-sans text-gray-900">
                
                {/* PAGE HEADER */}
                <div className="flex items-center justify-between px-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Assinatura</h1>
                    <p className="text-[13.5px] text-gray-500 mt-0.5">Gerencie seu plano e pagamento</p>
                  </div>
                  <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
                    <DialogTrigger asChild>
                      <button 
                        className="h-[38px] px-4 rounded-[10px] text-[13px] font-semibold border-[1.5px] border-gray-200 shadow-sm transition-all bg-white text-gray-900 hover:bg-gray-900 hover:text-white hover:border-gray-900 disabled:opacity-50 hover:shadow-md hover:-translate-y-[1px]"
                        disabled={!customer}
                      >
                        Gerenciar plano &rarr;
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px]">
                      <DialogHeader>
                        <DialogTitle>Escolha seu Plano</DialogTitle>
                        <DialogDescription>Desbloqueie todo o potencial da sua clinica</DialogDescription>
                      </DialogHeader>

                      <div className="grid md:grid-cols-3 gap-4 py-4">
                        <div
                          className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-all ${selectedPlan === 'basic' ? 'border-primary bg-primary/5' : ''}`}
                          onClick={() => setSelectedPlan('basic')}
                        >
                          <div className="text-lg font-bold">Basico</div>
                          <div className="text-2xl font-bold mt-2">R$ 99</div>
                          <div className="text-sm text-muted-foreground">/mes</div>
                          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <li>2 profissionais</li>
                            <li>Agenda simples</li>
                            <li>Confirmacao WhatsApp</li>
                          </ul>
                        </div>

                        <div
                          className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-all relative ${selectedPlan === 'professional' ? 'border-primary bg-primary/5' : ''}`}
                          onClick={() => setSelectedPlan('professional')}
                        >
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            Recomendado
                          </div>
                          <div className="text-lg font-bold text-primary">Profissional</div>
                          <div className="text-2xl font-bold mt-2">R$ 199</div>
                          <div className="text-sm text-muted-foreground">/mes</div>
                          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <li>10 profissionais</li>
                            <li>Google Calendar</li>
                            <li>Relatorios Avancados</li>
                            <li>IA de Risco</li>
                          </ul>
                        </div>

                        <div
                          className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-all ${selectedPlan === 'advanced' ? 'border-primary bg-primary/5' : ''}`}
                          onClick={() => setSelectedPlan('advanced')}
                        >
                          <div className="text-lg font-bold">Avancado</div>
                          <div className="text-2xl font-bold mt-2">R$ 349</div>
                          <div className="text-sm text-muted-foreground">/mes</div>
                          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <li>Ilimitado</li>
                            <li>API</li>
                            <li>Suporte VIP</li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button onClick={handleSubscribe} disabled={isSubscribing}>
                          {isSubscribing ? 'Processando...' : 'Confirmar Assinatura'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* CARD 1: STATUS DA ASSINATURA */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 fill-mode-both">
                  <div className="px-7 py-6 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[15px] font-bold tracking-tight text-gray-900">Status da Assinatura</h2>
                      <p className="text-[12.5px] text-gray-400 mt-1">
                        Ciclo {subscription?.cycle === 'YEARLY' ? 'anual' : 'mensal'} &middot; Renovacao automatica ativa
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide ${
                        clinic?.account?.subscription_status === 'active' ? 'bg-green-100/60 text-green-700 border border-green-200' :
                        clinic?.account?.subscription_status === 'pending' ? 'bg-yellow-100/60 text-yellow-700 border border-yellow-200' :
                        clinic?.account?.subscription_status === 'trial' ? 'bg-cyan-100/60 text-cyan-700 border border-cyan-200' :
                        'bg-red-100/60 text-red-700 border border-red-200'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                        {subscriptionLabels[clinic?.account?.subscription_status || "trial"]}
                      </span>
                      <span className="text-[12.5px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full tracking-wide">
                        &#10022; {clinic?.account?.plan?.slug === 'basic' ? 'Basico' : clinic?.account?.plan?.slug === 'professional' ? 'Profissional' : clinic?.account?.plan?.slug === 'advanced' ? 'Avancado' : clinic?.account?.plan?.name || clinic?.account?.plan?.slug || 'Free'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-7">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 transition-all hover:bg-white hover:border-gray-200 hover:shadow-sm">
                        <div className="text-[11.5px] font-medium text-gray-400 uppercase tracking-widest mb-2">Valor mensal</div>
                        <div className="text-[15.5px] font-bold text-gray-900 tracking-tight">
                          {subscription ? formatCurrency(subscription.value) : '---'}
                        </div>
                        <div className="text-[11.5px] text-gray-400 mt-1">por mes</div>
                      </div>

                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 transition-all hover:bg-white hover:border-gray-200 hover:shadow-sm">
                        <div className="text-[11.5px] font-medium text-gray-400 uppercase tracking-widest mb-2">Metodo de pagamento</div>
                        <div className="text-[13.5px] font-bold text-gray-900 truncate">
                          {subscription ? (subscription.billing_type === 'CREDIT_CARD' ? '💳 Cartao de Credito' : subscription.billing_type === 'PIX' ? '💠 PIX' : '📄 Boleto') : '---'}
                        </div>
                        <div className="text-[11.5px] text-gray-400 mt-1">padrao</div>
                      </div>
                    </div>

                    {(subscription || clinic?.account?.subscription_status === 'trial') && (
                      <div className="mt-5 bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="text-[12px] font-medium text-gray-500">
                            {clinic?.account?.subscription_status === 'trial' ? 'Progresso do período de teste' : 'Progresso do ciclo atual'}
                          </span>
                          <span className="text-[12px] font-bold text-gray-900 font-mono">
                            {(() => {
                              const due = subscription ? new Date(subscription.next_due_date) : (clinic?.account?.trial_ends_at ? new Date(clinic.account.trial_ends_at) : new Date());
                              const now = new Date();
                              const diffTime = due.getTime() - now.getTime();
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              return diffDays > 0 ? `${diffDays} dias restantes` : (diffDays === 0 ? 'Vence hoje' : 'Vencido');
                            })()}
                          </span>
                        </div>
                        <div className="h-[5px] bg-gray-200 rounded-full overflow-hidden">
                          {(() => {
                            try {
                              const due = subscription ? new Date(subscription.next_due_date) : (clinic?.account?.trial_ends_at ? new Date(clinic.account.trial_ends_at) : new Date());
                              const now = new Date();
                              let start = new Date(due);
                              
                              if (subscription) {
                                if (subscription.cycle === 'YEARLY') start.setFullYear(start.getFullYear() - 1);
                                else start.setMonth(start.getMonth() - 1);
                              } else if (clinic?.created_at) {
                                start = new Date(clinic.created_at);
                              } else {
                                start.setDate(start.getDate() - 14); // fallback 14 days
                              }
                              
                              const totalDays = (due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                              const passedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                              let percent = Math.max(0, Math.min(100, (passedDays / totalDays) * 100));
                              if (isNaN(percent) || !isFinite(percent)) percent = 0;
                              return (
                                <div 
                                  className={`h-full bg-gradient-to-r ${clinic?.account?.subscription_status === 'trial' ? 'from-cyan-500 to-cyan-400' : 'from-green-600 to-green-400'} rounded-full origin-left animate-in zoom-in-0 duration-1000 delay-300`}
                                  style={{ width: `${percent}%` }}
                                ></div>
                              );
                            } catch (e) {
                              return <div className={`h-full ${clinic?.account?.subscription_status === 'trial' ? 'bg-cyan-500' : 'bg-green-500'} rounded-full w-full`}></div>;
                            }
                          })()}
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-[11px] text-gray-400 font-mono">
                            Início: {(() => {
                              try {
                                if (subscription) {
                                  const due = new Date(subscription.next_due_date);
                                  if (subscription.cycle === 'YEARLY') due.setFullYear(due.getFullYear() - 1);
                                  else due.setMonth(due.getMonth() - 1);
                                  return formatDate(due.toISOString());
                                } else if (clinic?.created_at) {
                                  return formatDate(clinic.created_at);
                                }
                                return '---';
                              } catch(e) { return '---'; }
                            })()}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {clinic?.account?.subscription_status === 'trial' ? 'Expira em' : 'Renovação'}: {subscription ? formatDate(subscription.next_due_date) : (clinic?.account?.trial_ends_at ? formatDate(clinic.account.trial_ends_at) : '---')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: DADOS DE COBRANCA */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
                  <div className="px-7 py-6 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[15px] font-bold tracking-tight text-gray-900">Dados de Cobranca</h2>
                      <p className="text-[12.5px] text-gray-400 mt-1">Informações do cliente para faturamento</p>
                    </div>
                    {customer && !showCustomerForm && (
                      <button 
                        onClick={() => setShowCustomerForm(true)}
                        className="h-[30px] px-3.5 rounded-lg text-xs font-semibold border-[1.5px] border-gray-200 hover:border-gray-900 bg-white text-gray-600 hover:text-gray-900 transition-all shadow-sm hover:shadow"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                  <div className="p-7">
                    {showCustomerForm ? (
                        <form onSubmit={handleSubmit(onSubmitCustomer)} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="name">Nome <span className="text-destructive">*</span></Label>
                              <Input id="name" {...register('name')} className={errors.name ? 'border-destructive' : ''} />
                              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                              <Input id="email" type="email" {...register('email')} className={errors.email ? 'border-destructive' : ''} />
                              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="document">CPF/CNPJ <span className="text-destructive">*</span></Label>
                              <Input id="document" {...register('document')} className={errors.document ? 'border-destructive' : ''} />
                              {errors.document && <p className="text-sm text-destructive">{errors.document.message}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phone">Telefone</Label>
                              <Input id="phone" {...register('phone')} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="postal_code">CEP</Label>
                              <Input id="postal_code" {...register('postal_code')} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address">Endereco</Label>
                              <Input id="address" {...register('address')} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address_number">Numero</Label>
                              <Input id="address_number" {...register('address_number')} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="province">Bairro</Label>
                              <Input id="province" {...register('province')} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="city">Cidade</Label>
                              <Input id="city" {...register('city')} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="state">Estado</Label>
                              <Input id="state" {...register('state')} maxLength={2} placeholder="SP" className={errors.state ? 'border-destructive' : ''} />
                              {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" disabled={isCreatingCustomer}>
                              {isCreatingCustomer ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowCustomerForm(false)}>Cancelar</Button>
                          </div>
                        </form>
                    ) : customer ? (
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between py-[14px] border-b border-gray-100 gap-3 first:pt-0">
                          <div className="text-[13px] font-medium text-gray-500 flex items-center gap-2 shrink-0">
                            <span className="w-7 h-7 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center text-[13px]">👤</span>
                            Nome
                          </div>
                          <div className="text-[13.5px] font-medium text-gray-900 text-right break-words">{customer.name}</div>
                        </div>

                        <div className="flex items-center justify-between py-[14px] border-b border-gray-100 gap-3">
                          <div className="text-[13px] font-medium text-gray-500 flex items-center gap-2 shrink-0">
                            <span className="w-7 h-7 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center text-[13px]">✉️</span>
                            E-mail
                          </div>
                          <div className="text-[12.5px] font-medium text-gray-900 text-right break-words">{customer.email}</div>
                        </div>

                        <div className="flex items-center justify-between py-[14px] border-b border-gray-100 gap-3">
                          <div className="text-[13px] font-medium text-gray-500 flex items-center gap-2 shrink-0">
                            <span className="w-7 h-7 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center text-[13px]">📄</span>
                            Documento
                          </div>
                          <div className="text-right">
                            {customer.document ? (
                              <span className="text-[13.5px] font-medium text-gray-900">{customer.document}</span>
                            ) : (
                              <div>
                                <span className="text-[12.5px] text-gray-400 italic block">Nao informado</span>
                                <button onClick={() => setShowCustomerForm(true)} className="mt-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-md border-[1.5px] border-dashed border-gray-200 bg-transparent text-gray-500 transition-all hover:bg-gray-50 hover:border-gray-900 hover:text-gray-900">+ Adicionar CPF/CNPJ</button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-[14px] border-b border-gray-100 gap-3 last:border-0 last:pb-0">
                          <div className="text-[13px] font-medium text-gray-500 flex items-center gap-2 shrink-0">
                            <span className="w-7 h-7 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center text-[13px]">📱</span>
                            Telefone
                          </div>
                          <div className="text-right">
                            {customer.phone ? (
                              <span className="text-[13.5px] font-medium text-gray-900">{customer.phone}</span>
                            ) : (
                              <span className="text-[12.5px] text-gray-400 italic">Nao informado</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-[13px] mb-4">Nenhum dado cadastrado.</p>
                        <button onClick={() => setShowCustomerForm(true)} className="h-[38px] px-4 rounded-[10px] text-[13px] font-semibold border-[1.5px] border-gray-200 shadow-sm transition-all bg-white text-gray-900 hover:bg-gray-900 hover:text-white hover:border-gray-900">
                          Cadastrar Dados
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 3: HISTORICO DE PAGAMENTOS */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
                  <div className="px-7 py-6 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[15px] font-bold tracking-tight text-gray-900">Historico de Pagamentos</h2>
                      <p className="text-[12.5px] text-gray-400 mt-1">Ultimos pagamentos realizados</p>
                    </div>
                    <span className="text-[12px] text-gray-400 font-mono bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">{payments.length} registro{payments.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="p-7">
                    <div className="space-y-3.5">
                      {payments.map(payment => (
                        <div key={payment.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50 border border-gray-100 transition-all hover:bg-white hover:border-gray-200 hover:shadow-sm hover:translate-x-1 cursor-default">
                          <div className="w-10 h-10 rounded-md bg-white border border-gray-200 flex items-center justify-center text-[18px] shrink-0 shadow-sm">
                            {payment.billing_type === 'CREDIT_CARD' ? '💳' : payment.billing_type === 'PIX' ? '💠' : '📄'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13.5px] font-semibold text-gray-900 truncate">{billingTypeLabels[payment.billing_type] || payment.billing_type}</div>
                            <div className="text-[12px] text-gray-400 mt-0.5 font-mono">Vencimento: {formatDate(payment.due_date)}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <div className="text-[15px] font-bold text-gray-900 font-mono tracking-tight">{formatCurrency(payment.value)}</div>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              payment.status === 'CONFIRMED' || payment.status === 'RECEIVED' ? 'bg-cyan-100/60 text-cyan-700 border border-cyan-200' :
                              payment.status === 'PENDING' ? 'bg-yellow-100/60 text-yellow-700 border border-yellow-200' :
                              payment.status === 'OVERDUE' ? 'bg-red-100/60 text-red-700 border border-red-200' :
                              'bg-gray-100/60 text-gray-700 border border-gray-200'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {paymentStatusLabels[payment.status]?.label || payment.status}
                            </span>
                            
                            <div className="flex gap-1.5 mt-0.5">
                              {payment.billing_type === 'PIX' && payment.status === 'PENDING' && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button className="font-sans text-[11.5px] font-semibold px-3 py-1.5 rounded-md border-[1.5px] border-gray-200 bg-white text-gray-500 hover:text-white hover:bg-gray-900 hover:border-gray-900 shadow-sm transition-all tracking-wide" onClick={() => handleViewPix(payment)}>Ver PIX</button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Pagamento via PIX</DialogTitle>
                                      <DialogDescription>Escaneie o QR Code ou copie o codigo PIX</DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-col items-center gap-4 py-4">
                                      {isLoadingPix ? (
                                        <div className="animate-pulse bg-gray-200 w-48 h-48 rounded"></div>
                                      ) : pixQRCode ? (
                                        <>
                                          <img src={`data:image/png;base64,${pixQRCode.encodedImage}`} alt="PIX QR Code" className="w-48 h-48" />
                                          <div className="w-full">
                                            <Label>Codigo PIX (Copia e Cola)</Label>
                                            <div className="flex gap-2 mt-1">
                                              <Input value={pixQRCode.payload} readOnly className="text-xs" />
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(pixQRCode.payload)
                                                  showToast.success('Codigo copiado!')
                                                }}
                                              >
                                                Copiar
                                              </Button>
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        <p className="text-muted-foreground">QR Code nao disponivel</p>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                              {payment.invoice_url && (
                                <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer" className="font-sans text-[11.5px] font-semibold px-3 py-1.5 rounded-md border-[1.5px] border-gray-200 bg-white text-gray-500 hover:text-white hover:bg-gray-900 hover:border-gray-900 shadow-sm transition-all flex items-center gap-1.5 tracking-wide">
                                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                  Fatura
                                </a>
                              )}
                              {payment.bank_slip_url && (
                                <a href={payment.bank_slip_url} target="_blank" rel="noopener noreferrer" className="font-sans text-[11.5px] font-semibold px-3 py-1.5 rounded-md border-[1.5px] border-gray-200 bg-white text-gray-500 hover:text-white hover:bg-gray-900 hover:border-gray-900 shadow-sm transition-all flex items-center gap-1.5 tracking-wide">
                                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                  Boleto
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {payments.length === 0 && (
                        <p className="text-center text-gray-400 py-4 text-[13px]">Nenhum pagamento encontrado</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </TabsContent>
            {/* Tab: Conta */}
            <TabsContent value="pagamentos" className="mt-0 outline-none space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Metodos de Pagamento</CardTitle>
                      <CardDescription>Configure como sua clinica recebe pagamentos. Esses metodos aparecem ao registrar pagamento de uma sessao.</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => { setShowNewMethodForm(true); setNewMethodName(""); setNewMethodType("pix") }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo metodo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {showNewMethodForm && (
                    <div className="flex items-end gap-3 p-4 border rounded-lg bg-muted/30">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs">Nome</Label>
                        <Input
                          placeholder="Ex: Maquininha Stone"
                          value={newMethodName}
                          onChange={(e) => setNewMethodName(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="w-40 space-y-1.5">
                        <Label className="text-xs">Tipo</Label>
                        <Select value={newMethodType} onValueChange={(v) => setNewMethodType(v as PaymentMethodType)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(paymentTypeLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" onClick={handleCreateMethod} disabled={isSavingMethod || !newMethodName.trim()}>
                        {isSavingMethod ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowNewMethodForm(false)}>Cancelar</Button>
                    </div>
                  )}

                  {isLoadingPaymentMethods ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nenhum metodo de pagamento cadastrado. Clique em &quot;Novo metodo&quot; para comecar.</p>
                  ) : (
                    <div className="space-y-2">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className={`flex items-center justify-between p-3 border rounded-lg ${method.active ? '' : 'opacity-50'}`}>
                          {editingMethod?.id === method.id ? (
                            <div className="flex items-center gap-3 flex-1">
                              <Input
                                value={editingMethod.name}
                                onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                                className="max-w-[200px]"
                              />
                              <Select value={editingMethod.type} onValueChange={(v) => setEditingMethod({ ...editingMethod, type: v as PaymentMethodType })}>
                                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(paymentTypeLabels).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" onClick={() => handleUpdateMethod(editingMethod)} disabled={isSavingMethod}>
                                {isSavingMethod ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingMethod(null)}>Cancelar</Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-sm">{method.name}</span>
                                <Badge variant="secondary" className="text-xs">{paymentTypeLabels[method.type] || method.type}</Badge>
                                {!method.active && <Badge variant="outline" className="text-xs text-muted-foreground">Inativo</Badge>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch checked={method.active} onCheckedChange={() => handleToggleMethod(method)} />
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingMethod({ ...method })}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteMethod(method.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Financeiro (Marketplace) */}
            <TabsContent value="financeiro" className="mt-0 outline-none space-y-6">
              <PlanRestriction requiredPlan="professional" message="Recebimento de pagamentos online disponível no plano Profissional">
              {isLoadingSubaccount ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : subaccount ? (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Conta Financeira</CardTitle>
                          <CardDescription>Sua clinica esta configurada para receber pagamentos de pacientes</CardDescription>
                        </div>
                        <Badge variant={subaccount.status === 'active' ? 'default' : subaccount.status === 'pending' ? 'outline' : 'destructive'}>
                          {subaccount.status === 'active' && <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativa</>}
                          {subaccount.status === 'pending' && <><Clock className="h-3 w-3 mr-1" /> Pendente</>}
                          {subaccount.status === 'rejected' && <><XCircle className="h-3 w-3 mr-1" /> Rejeitada</>}
                          {subaccount.status === 'suspended' && <><XCircle className="h-3 w-3 mr-1" /> Suspensa</>}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-xs">Empresa</Label>
                          <p className="font-medium">{subaccount.company_name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">CNPJ/CPF</Label>
                          <p className="font-medium">{subaccount.cpf_cnpj}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Email</Label>
                          <p className="font-medium">{subaccount.email}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Wallet ID</Label>
                          <div className="flex items-center gap-2">
                            <p className="font-medium font-mono text-sm">
                              {showWalletId ? subaccount.wallet_id : "••••••••-••••-••••-••••-••••••••••••"}
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowWalletId(!showWalletId)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showWalletId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {subaccount.status === 'active' && (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                          <p className="text-sm text-green-700 dark:text-green-300">
                            <CheckCircle2 className="h-4 w-4 inline mr-1" />
                            Sua clinica pode receber pagamentos via PIX e Cartao de Credito. Os pacientes poderao pagar diretamente ao agendar.
                          </p>
                        </div>
                      )}

                      {subaccount.status === 'pending' && (
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Sua conta esta em analise. Assim que aprovada, voce podera receber pagamentos.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {subaccount.status === 'active' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Pagamento antecipado</CardTitle>
                        <CardDescription>
                          Configure se o paciente deve pagar antes de confirmar o agendamento online
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Exigir pagamento antes do agendamento</p>
                            <p className="text-xs text-muted-foreground">
                              Quando ativado, o paciente so confirma a consulta apos pagar via PIX. O horario fica reservado por 15 minutos.
                            </p>
                          </div>
                          <Switch
                            checked={clinic?.settings?.require_payment_before_booking ?? false}
                            onCheckedChange={async (checked) => {
                              try {
                                const updated = await api.updateClinic({ settings: { require_payment_before_booking: checked } })
                                setClinic(updated)
                                showToast.success(checked ? "Pagamento antecipado ativado" : "Pagamento antecipado desativado")
                              } catch (err) {
                                handleApiError(err)
                              }
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Receba pagamentos dos pacientes</CardTitle>
                      <CardDescription>
                        Configure sua conta para receber pagamentos via PIX e Cartao de Credito diretamente na sua conta bancaria. O dinheiro cai direto na sua conta — sem intermediarios.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="mkt_company_name">Nome da Empresa *</Label>
                          <Input
                            id="mkt_company_name"
                            value={mktCompanyName}
                            onChange={(e) => setMktCompanyName(e.target.value)}
                            placeholder="Clinica Exemplo LTDA"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mkt_cpf_cnpj">CNPJ ou CPF *</Label>
                          <Input
                            id="mkt_cpf_cnpj"
                            value={mktCpfCnpj}
                            onChange={(e) => setMktCpfCnpj(e.target.value)}
                            placeholder="00.000.000/0000-00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mkt_company_type">Tipo de Empresa</Label>
                          <Select value={mktCompanyType} onValueChange={setMktCompanyType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MEI">MEI</SelectItem>
                              <SelectItem value="LIMITED">LTDA</SelectItem>
                              <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                              <SelectItem value="ASSOCIATION">Associacao</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mkt_income_value">Faturamento Mensal *</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                            <Input
                              id="mkt_income_value"
                              className="pl-10"
                              value={mktIncomeValue}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^\d]/g, "")
                                if (!raw) { setMktIncomeValue(""); return }
                                const cents = parseInt(raw, 10)
                                const formatted = (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                setMktIncomeValue(formatted)
                              }}
                              placeholder="5.000,00"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mkt_birth_date">Data de Nascimento</Label>
                          <Input
                            id="mkt_birth_date"
                            type="date"
                            value={mktBirthDate}
                            onChange={(e) => setMktBirthDate(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mkt_email">Email *</Label>
                          <Input
                            id="mkt_email"
                            type="email"
                            value={mktEmail}
                            onChange={(e) => setMktEmail(e.target.value)}
                            placeholder="financeiro@clinica.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mkt_phone">Celular</Label>
                          <Input
                            id="mkt_phone"
                            value={mktPhone}
                            onChange={(e) => setMktPhone(e.target.value)}
                            placeholder="11999999999"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium mb-3">Endereco</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="mkt_postal_code">CEP</Label>
                            <Input
                              id="mkt_postal_code"
                              value={mktPostalCode}
                              onChange={(e) => setMktPostalCode(e.target.value)}
                              placeholder="00000-000"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mkt_address">Rua</Label>
                            <Input
                              id="mkt_address"
                              value={mktAddress}
                              onChange={(e) => setMktAddress(e.target.value)}
                              placeholder="Rua Exemplo"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mkt_address_number">Numero</Label>
                            <Input
                              id="mkt_address_number"
                              value={mktAddressNumber}
                              onChange={(e) => setMktAddressNumber(e.target.value)}
                              placeholder="100"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mkt_province">Bairro</Label>
                            <Input
                              id="mkt_province"
                              value={mktProvince}
                              onChange={(e) => setMktProvince(e.target.value)}
                              placeholder="Centro"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mkt_city">Cidade</Label>
                            <Input
                              id="mkt_city"
                              value={mktCity}
                              onChange={(e) => setMktCity(e.target.value)}
                              placeholder="Sao Paulo"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mkt_state">Estado</Label>
                            <Input
                              id="mkt_state"
                              value={mktState}
                              onChange={(e) => setMktState(e.target.value)}
                              placeholder="SP"
                              maxLength={2}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">
                          Ao criar sua conta financeira, seus dados serao enviados ao gateway de pagamento (Asaas) para validacao.
                          Apos aprovacao, voce podera receber pagamentos de pacientes via PIX e Cartao de Credito diretamente na sua conta.
                        </p>
                      </div>

                      <Button
                        onClick={handleCreateSubaccount}
                        disabled={isCreatingSubaccount || !mktCompanyName.trim() || !mktCpfCnpj.trim() || !mktEmail.trim() || !mktIncomeValue}
                        className="w-full"
                      >
                        {isCreatingSubaccount ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando conta...
                          </>
                        ) : (
                          <>
                            <Store className="mr-2 h-4 w-4" />
                            Ativar Recebimento de Pagamentos
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
              </PlanRestriction>
            </TabsContent>

            <TabsContent value="conta" className="mt-0 outline-none space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sua Conta</CardTitle>
                  <CardDescription>Informacoes do seu usuario</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_name">Nome</Label>
                    <div className="flex gap-2">
                      <Input id="user_name" value={userName} onChange={(e) => setUserName(e.target.value)} disabled={isSavingUser} />
                      {userNameChanged && (
                        <>
                          <Button size="sm" onClick={handleSaveUserName} disabled={isSavingUser}>
                            {isSavingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelUserEdit} disabled={isSavingUser}>
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user_email">Email</Label>
                    <Input id="user_email" value={user?.email || ""} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">O email nao pode ser alterado.</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Funcao</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {user?.role === "owner"
                          ? "Proprietario"
                          : user?.role === "admin"
                          ? "Administrador"
                          : user?.role === "professional"
                          ? "Profissional"
                          : "Recepcionista"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button variant="outline" onClick={handleRequestPasswordReset} disabled={isSendingPasswordReset}>
                      {isSendingPasswordReset ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Alterar Senha"
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Um email sera enviado para {user?.email} com instrucoes para alterar sua senha.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
