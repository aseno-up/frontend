"use client"

import { useCallback, useEffect, useState } from "react"
import { Building2, Bell, CreditCard, Users, Calendar } from "lucide-react"

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
import { CalendarIntegration, GoogleCalendar } from "@/types/api"

interface ConfiguracoesPageProps {
  params: Promise<{ lng: string }>
}

export default function ConfiguracoesPage({ params }: ConfiguracoesPageProps) {
  const [lng, setLng] = useState("pt-BR")
  const { clinic, user } = useAuthStore()

  // Calendar integration state
  const [calendarIntegration, setCalendarIntegration] = useState<CalendarIntegration | null>(null)
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("")

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

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
      // Open Google OAuth in a new window
      window.open(data.auth_url, '_blank', 'width=600,height=700')
    } catch (err) {
      console.error('Failed to get auth URL:', err)
    } finally {
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
      <Header lng={lng} title="Configuracoes" />

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
                <Input
                  id="clinic_name"
                  value={clinic?.name || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_slug">Identificador</Label>
                <Input
                  id="clinic_slug"
                  value={clinic?.slug || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Para alterar o nome da clinica, entre em contato com o suporte.
              </p>
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
                  <p className="text-sm text-muted-foreground capitalize">
                    {clinic?.plan || "Free"}
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">
                    Enviar lembretes de consulta via WhatsApp
                  </p>
                </div>
                <Badge variant="secondary">Em breve</Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    Enviar confirmacoes por email
                  </p>
                </div>
                <Badge variant="secondary">Em breve</Badge>
              </div>
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
              {isLoadingCalendar ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : calendarIntegration?.connected ? (
                <>
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
                </>
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="user_name">Nome</Label>
                  <Input
                    id="user_name"
                    value={user?.name || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user_email">Email</Label>
                  <Input
                    id="user_email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
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

              <Button variant="outline">Alterar Senha</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
