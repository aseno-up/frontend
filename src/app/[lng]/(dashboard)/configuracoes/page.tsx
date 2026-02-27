"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, Bell, CreditCard, Users, Calendar, Loader2, Check, Copy, ExternalLink, Link2 } from "lucide-react"

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
import { CalendarIntegration, GoogleCalendar, BillingCustomer, Payment, Subscription, PaymentStatus, PixQRCode } from "@/types/api"
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
    past_due: "Pagamento Pendente",
    canceled: "Cancelada",
  }

  const subscriptionVariants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
    trial: "info",
    active: "success",
    past_due: "warning",
    canceled: "destructive",
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Configuracoes" tutorialPage="configuracoes" />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <Tabs defaultValue="clinica" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="clinica" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Clinica</span>
              </TabsTrigger>
              <TabsTrigger value="notificacoes" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notificacoes</span>
              </TabsTrigger>
              <TabsTrigger value="integracoes" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline">Integracoes</span>
              </TabsTrigger>
              <TabsTrigger value="assinatura" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Assinatura</span>
              </TabsTrigger>
              <TabsTrigger value="conta" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Conta</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Clinica */}
            <TabsContent value="clinica" className="space-y-6">
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
            <TabsContent value="notificacoes" className="space-y-6">
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
            <TabsContent value="integracoes" className="space-y-6">
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
            <TabsContent value="assinatura" className="space-y-6">
              {/* Status da Assinatura */}
              <Card>
                <CardHeader>
                  <CardTitle>Status da Assinatura</CardTitle>
                  <CardDescription>Gerencie seu plano e pagamento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Status</p>
                      <Badge variant={subscriptionVariants[clinic?.subscription_status || "trial"]} className="mt-1">
                        {subscriptionLabels[clinic?.subscription_status || "trial"]}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Plano</p>
                      <p className="text-sm text-muted-foreground">
                        {clinic?.subscription_status === "trial"
                          ? "Acesso completo (trial)"
                          : clinic?.plan === "basic"
                            ? "Basico"
                            : clinic?.plan === "professional"
                              ? "Profissional"
                              : clinic?.plan === "advanced"
                                ? "Avancado"
                                : clinic?.plan || "Free"}
                      </p>
                    </div>
                  </div>

                  {clinic?.subscription_status === "trial" && clinic?.trial_ends_at && (
                    <div className="rounded-lg bg-blue-50 p-4 text-blue-900">
                      <p className="text-sm">
                        Seu periodo de teste termina em <strong>{new Date(clinic.trial_ends_at).toLocaleDateString("pt-BR")}</strong>
                      </p>
                    </div>
                  )}

                  {isLoadingSubscription ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ) : subscription ? (
                    <div className="space-y-2 text-sm border-t pt-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-medium">{formatCurrency(subscription.value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ciclo:</span>
                        <span>{subscription.cycle === 'MONTHLY' ? 'Mensal' : subscription.cycle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Metodo:</span>
                        <span>{billingTypeLabels[subscription.billing_type] || subscription.billing_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Proximo vencimento:</span>
                        <span>{formatDate(subscription.next_due_date)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 border-t">
                      <p className="text-muted-foreground mb-4">Nenhuma assinatura ativa</p>

                      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
                        <DialogTrigger asChild>
                          <Button disabled={!customer}>Assinar Plano</Button>
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

                      {!customer && (
                        <p className="text-xs text-muted-foreground mt-2">Cadastre os dados de cobranca primeiro</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dados de Cobranca */}
              <Card>
                <CardHeader>
                  <CardTitle>Dados de Cobranca</CardTitle>
                  <CardDescription>Informacoes do cliente para faturamento</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingCustomer ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ) : customer ? (
                    <div className="space-y-2 text-sm">
                      <p><strong>Nome:</strong> {customer.name}</p>
                      <p><strong>Email:</strong> {customer.email}</p>
                      <p><strong>Documento:</strong> {customer.document}</p>
                      {customer.phone && <p><strong>Telefone:</strong> {customer.phone}</p>}
                      {customer.address && (
                        <p><strong>Endereco:</strong> {customer.address}, {customer.address_number} - {customer.province}, {customer.city}/{customer.state}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {!showCustomerForm ? (
                        <Button onClick={() => setShowCustomerForm(true)}>Cadastrar Dados de Cobranca</Button>
                      ) : (
                        <form onSubmit={handleSubmit(onSubmitCustomer)} className="space-y-4">
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
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Historico de Pagamentos */}
              <Card>
                <CardHeader>
                  <CardTitle>Historico de Pagamentos</CardTitle>
                  <CardDescription>Ultimos pagamentos realizados</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPayments ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  ) : payments.length > 0 ? (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{formatCurrency(payment.value)}</span>
                              <Badge variant={paymentStatusLabels[payment.status]?.variant || 'outline'}>
                                {paymentStatusLabels[payment.status]?.label || payment.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {billingTypeLabels[payment.billing_type] || payment.billing_type} - Vencimento: {formatDate(payment.due_date)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {payment.billing_type === 'PIX' && payment.status === 'PENDING' && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => handleViewPix(payment)}>Ver PIX</Button>
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
                              <Button variant="outline" size="sm" asChild>
                                <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer">Fatura</a>
                              </Button>
                            )}
                            {payment.bank_slip_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={payment.bank_slip_url} target="_blank" rel="noopener noreferrer">Boleto</a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum pagamento encontrado</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Conta */}
            <TabsContent value="conta" className="space-y-6">
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
          </Tabs>
        </div>
      </div>
    </div>
  )
}
