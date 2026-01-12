"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Building2, Bell, CreditCard, Users, Calendar, Loader2, Check } from "lucide-react"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/stores/auth-store"
import { api } from "@/lib/api/client"
import { handleApiError, showToast } from "@/lib/toast"
import { CalendarIntegration, GoogleCalendar } from "@/types/api"
import { PlanRestriction } from "@/components/plan-restriction"

interface ConfiguracoesPageProps {
  params: Promise<{ lng: string }>
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

  // Calendar integration state
  const [calendarIntegration, setCalendarIntegration] = useState<CalendarIntegration | null>(null)
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("")

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  // Handle calendar OAuth callback result
  useEffect(() => {
    const calendarStatus = searchParams.get("calendar")
    if (calendarStatus === "connected") {
      showToast.success("Google Calendar conectado com sucesso!")
      // Remove query param from URL without reload
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
    }
  }, [clinic?.settings])

  const canEditClinic = user?.role === "admin" || user?.role === "owner"

  const handleSaveClinicName = async () => {
    if (!clinicName.trim() || !clinicNameChanged) {
      return
    }

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

  const handleSaveUserName = async () => {
    if (!userName.trim() || !userNameChanged || !user?.id) {
      return
    }

    try {
      setIsSavingUser(true)
      await api.updateUser(user.id, { name: userName.trim() })
      // Reload user data
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
      setWhatsappReminders(!enabled) // Revert on error
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
      setEmailReminders(!enabled) // Revert on error
      handleApiError(err)
    } finally {
      setIsSavingNotifications(false)
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

  const fetchCalendarIntegration = useCallback(async () => {
    try {
      setIsLoadingCalendar(true)
      const data = await api.getCalendarIntegration()
      setCalendarIntegration(data)
      if (data.calendar_id) {
        setSelectedCalendarId(data.calendar_id)
      }
      // Fetch available calendars if connected
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
      // Navigate in the same tab (not a popup) so user returns to full window
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
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Clinic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Dados da Clinica</CardTitle>
              </div>
              <CardDescription>
                Informacoes basicas sobre sua clinica
              </CardDescription>
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
                      <Button
                        size="sm"
                        onClick={handleSaveClinicName}
                        disabled={isSavingClinic}
                      >
                        {isSavingClinic ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelClinicEdit}
                        disabled={isSavingClinic}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_slug">Identificador</Label>
                <Input
                  id="clinic_slug"
                  value={clinic?.slug || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O identificador nao pode ser alterado.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Assinatura</CardTitle>
              </div>
              <CardDescription>Gerencie seu plano e pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Status</p>
                  <Badge
                    variant={
                      subscriptionVariants[clinic?.subscription_status || "trial"]
                    }
                    className="mt-1"
                  >
                    {subscriptionLabels[clinic?.subscription_status || "trial"]}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-medium">Plano</p>
                  <p className="text-sm text-muted-foreground">
                    {clinic?.subscription_status === "trial"
                      ? "Acesso completo (trial)"
                      : clinic?.plan === "basic"
                        ? "Básico"
                        : clinic?.plan === "professional"
                          ? "Profissional"
                          : clinic?.plan === "advanced"
                            ? "Avançado"
                            : clinic?.plan || "Free"}
                  </p>
                </div>
              </div>

              {clinic?.subscription_status === "trial" && clinic?.trial_ends_at && (
                <div className="rounded-lg bg-blue-50 p-4 text-blue-900">
                  <p className="text-sm">
                    Seu periodo de teste termina em{" "}
                    <strong>
                      {new Date(clinic.trial_ends_at).toLocaleDateString("pt-BR")}
                    </strong>
                  </p>
                </div>
              )}

              <Separator />

              <Button variant="outline" className="w-full">
                Gerenciar Assinatura
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Notificacoes</CardTitle>
              </div>
              <CardDescription>
                Configure as notificacoes automaticas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PlanRestriction requiredPlan="professional">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">
                        Enviar lembretes de consulta via WhatsApp
                      </p>
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
                      <p className="text-sm text-muted-foreground">
                        Enviar confirmacoes por email
                      </p>
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

          {/* Google Calendar Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Google Calendar</CardTitle>
              </div>
              <CardDescription>
                Sincronize seus agendamentos com o Google Calendar
              </CardDescription>
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
                        <p className="text-sm text-muted-foreground">
                          {calendarIntegration.email}
                        </p>
                      </div>
                      <Badge variant="success">Conectado</Badge>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Calendario para sincronizar</Label>
                      <Select
                        value={selectedCalendarId}
                        onValueChange={handleSelectCalendar}
                      >
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
                        <p className="text-sm text-muted-foreground">
                          Criar eventos no Google Calendar automaticamente
                        </p>
                      </div>
                      <Switch
                        checked={calendarIntegration.sync_enabled}
                        onCheckedChange={handleToggleSync}
                      />
                    </div>

                    {calendarIntegration.last_sync_at && (
                      <p className="text-xs text-muted-foreground">
                        Ultima sincronizacao:{" "}
                        {new Date(calendarIntegration.last_sync_at).toLocaleString("pt-BR")}
                      </p>
                    )}

                    <Separator />

                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleDisconnectGoogle}
                    >
                      Desconectar Google Calendar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Conecte sua conta do Google para sincronizar seus agendamentos
                      automaticamente com o Google Calendar.
                    </p>
                    <Button
                      onClick={handleConnectGoogle}
                      disabled={isConnecting}
                      className="w-full"
                    >
                      {isConnecting ? "Conectando..." : "Conectar Google Calendar"}
                    </Button>
                  </div>
                )}
              </PlanRestriction>
            </CardContent>
          </Card>

          {/* User Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Sua Conta</CardTitle>
              </div>
              <CardDescription>Informacoes do seu usuario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user_name">Nome</Label>
                <div className="flex gap-2">
                  <Input
                    id="user_name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    disabled={isSavingUser}
                  />
                  {userNameChanged && (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSaveUserName}
                        disabled={isSavingUser}
                      >
                        {isSavingUser ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelUserEdit}
                        disabled={isSavingUser}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_email">Email</Label>
                <Input
                  id="user_email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O email nao pode ser alterado.
                </p>
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
                <Button
                  variant="outline"
                  onClick={handleRequestPasswordReset}
                  disabled={isSendingPasswordReset}
                >
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
        </div>
      </div>
    </div>
  )
}
