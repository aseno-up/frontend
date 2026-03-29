"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, Bell, CreditCard, Users, Calendar, Loader2, Check, Copy, ExternalLink, Link2, Wallet, Plus, Pencil, Trash2, Store, CheckCircle2, Clock, XCircle, Eye, EyeOff } from "lucide-react"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { CalendarIntegration, GoogleCalendar, BillingCustomer, Payment, Subscription, PaymentStatus, PixQRCode, PaymentMethod, PaymentMethodType, Subaccount, SplitConfig } from "@/types/api"
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

  // Clinic editing state
  const [clinicName, setClinicName] = useState(clinic?.name || "")
  const [isSavingClinic, setIsSavingClinic] = useState(false)
  const clinicNameChanged = clinicName !== (clinic?.name || "")

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
  const [emailReminders, setEmailReminders] = useState(
    clinic?.settings?.email_reminders_enabled ?? false
  )
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)

  // AI agent state
  const [aiAgentEnabled, setAiAgentEnabled] = useState(
    clinic?.settings?.ai_agent_enabled ?? false
  )
  const [isSavingAiAgent, setIsSavingAiAgent] = useState(false)

  // Online booking state
  const [allowOnlineBooking, setAllowOnlineBooking] = useState(
    clinic?.settings?.allow_online_booking ?? false
  )
  const [isSavingOnlineBooking, setIsSavingOnlineBooking] = useState(false)

  // Calendar integration state
  const [calendarIntegration, setCalendarIntegration] = useState<CalendarIntegration | null>(null)
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("")

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

  // Handle calendar OAuth callback result
  useEffect(() => {
    const calendarStatus = searchParams.get("calendar")
    if (calendarStatus === "connected") {
      showToast.success("Google Calendar conectado com sucesso!")
      router.replace(`/${lng}/configuracoes`, { scroll: false })
    } else if (calendarStatus === "error") {
      showToast.error("Erro ao conectar Google Calendar. Tente novamente.")
      router.replace(`/${lng}/configuracoes`, { scroll: false })
    }
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
      setEmailReminders(clinic.settings.email_reminders_enabled ?? false)
      setAiAgentEnabled(clinic.settings.ai_agent_enabled ?? false)
      setAllowOnlineBooking(clinic.settings.allow_online_booking ?? false)
    }
  }, [clinic?.settings])

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

  const handleToggleEmailReminders = async (enabled: boolean) => {
    if (!canEditClinic) return

    try {
      setIsSavingNotifications(true)
      setEmailReminders(enabled)
      const updatedClinic = await api.updateClinic({
        settings: {
          ...clinic?.settings,
          email_reminders_enabled: enabled,
        },
      })
      setClinic(updatedClinic)
      showToast.success(enabled ? "Lembretes por email ativados" : "Lembretes por email desativados")
    } catch (err) {
      setEmailReminders(!enabled)
      handleApiError(err)
    } finally {
      setIsSavingNotifications(false)
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

  // Calendar handlers
  const fetchCalendarIntegration = useCallback(async () => {
    try {
      setIsLoadingCalendar(true)
      const data = await api.getCalendarIntegration()
      setCalendarIntegration(data)
      if (data.calendar_id) {
        setSelectedCalendarId(data.calendar_id)
      }
      if (data.connected) {
        const calendarsData = await api.listGoogleCalendars()
        setCalendars(calendarsData.calendars || [])
      }
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

  const handleConnectGoogle = async () => {
    try {
      setIsConnecting(true)
      const data = await api.getCalendarAuthURL()
      window.location.href = data.auth_url
    } catch (err) {
      handleApiError(err)
      setIsConnecting(false)
    }
  }

  const handleDisconnectGoogle = async () => {
    try {
      await api.disconnectCalendar()
      setCalendarIntegration(null)
      setCalendars([])
    } catch (err) {
      console.error('Failed to disconnect:', err)
    }
  }

  const handleSelectCalendar = async (calendarId: string) => {
    try {
      await api.setGoogleCalendar(calendarId)
      setSelectedCalendarId(calendarId)
    } catch (err) {
      console.error('Failed to set calendar:', err)
    }
  }

  const handleToggleSync = async () => {
    if (!calendarIntegration) return
    try {
      await api.updateCalendarSettings(
        !calendarIntegration.sync_enabled,
        calendarIntegration.sync_direction
      )
      setCalendarIntegration({
        ...calendarIntegration,
        sync_enabled: !calendarIntegration.sync_enabled,
      })
    } catch (err) {
      console.error('Failed to update sync settings:', err)
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
          <Tabs defaultValue="clinica" className="w-full flex-1 flex flex-col overflow-hidden min-h-0">
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
                  value="notificacoes" 
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notificacoes</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="integracoes" 
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Integracoes</span>
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
                      <Label>Atendimento por IA (WhatsApp)</Label>
                      <p className="text-sm text-muted-foreground">Ativar o assistente virtual para responder pacientes via WhatsApp</p>
                    </div>
                    <Switch
                      checked={aiAgentEnabled}
                      onCheckedChange={handleToggleAIAgent}
                      disabled={!canEditClinic || isSavingAiAgent}
                    />
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
            </TabsContent>

            {/* Tab: Notificacoes */}
            <TabsContent value="notificacoes" className="mt-0 outline-none space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notificacoes</CardTitle>
                  <CardDescription>Configure as notificacoes automaticas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PlanRestriction requiredPlan="professional">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">WhatsApp</p>
                          <p className="text-sm text-muted-foreground">Enviar lembretes de consulta via WhatsApp</p>
                        </div>
                        <Switch
                          checked={whatsappReminders}
                          onCheckedChange={handleToggleWhatsappReminders}
                          disabled={isSavingNotifications || !canEditClinic}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">Enviar confirmacoes por email</p>
                        </div>
                        <Switch
                          checked={emailReminders}
                          onCheckedChange={handleToggleEmailReminders}
                          disabled={isSavingNotifications || !canEditClinic}
                        />
                      </div>

                      {!canEditClinic && (
                        <p className="text-xs text-muted-foreground">
                          Apenas administradores podem alterar as configuracoes de notificacao.
                        </p>
                      )}
                    </div>
                  </PlanRestriction>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Integracoes */}
            <TabsContent value="integracoes" className="mt-0 outline-none space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Google Calendar</CardTitle>
                  </div>
                  <CardDescription>Sincronize seus agendamentos com o Google Calendar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PlanRestriction requiredPlan="professional">
                    {isLoadingCalendar ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : calendarIntegration?.connected ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Conta conectada</p>
                            <p className="text-sm text-muted-foreground">{calendarIntegration.email}</p>
                          </div>
                          <Badge variant="success">Conectado</Badge>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>Calendario para sincronizar</Label>
                          <Select value={selectedCalendarId} onValueChange={handleSelectCalendar}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um calendario" />
                            </SelectTrigger>
                            <SelectContent>
                              {calendars.map((cal) => (
                                <SelectItem key={cal.id} value={cal.id}>
                                  {cal.summary} {cal.primary && "(Principal)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Sincronizacao automatica</p>
                            <p className="text-sm text-muted-foreground">Criar eventos no Google Calendar automaticamente</p>
                          </div>
                          <Switch checked={calendarIntegration.sync_enabled} onCheckedChange={handleToggleSync} />
                        </div>

                        {calendarIntegration.last_sync_at && (
                          <p className="text-xs text-muted-foreground">
                            Ultima sincronizacao: {new Date(calendarIntegration.last_sync_at).toLocaleString("pt-BR")}
                          </p>
                        )}

                        <Separator />

                        <Button variant="destructive" className="w-full" onClick={handleDisconnectGoogle}>
                          Desconectar Google Calendar
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Conecte sua conta do Google para sincronizar seus agendamentos automaticamente com o Google Calendar.
                        </p>
                        <Button onClick={handleConnectGoogle} disabled={isConnecting} className="w-full">
                          {isConnecting ? "Conectando..." : "Conectar Google Calendar"}
                        </Button>
                      </div>
                    )}
                  </PlanRestriction>
                </CardContent>
              </Card>
            </TabsContent>

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
