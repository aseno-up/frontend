"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Shield,
  Zap,
} from "lucide-react"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GoogleCalendarLogo, GoogleGLogo } from "@/components/icons/google-logos"
import { api } from "@/lib/api/client"
import { handleApiError, showToast } from "@/lib/toast"
import { CalendarIntegration, GoogleCalendar } from "@/types/api"

interface GoogleCalendarIntegrationPageProps {
  params: Promise<{ lng: string }>
}

export default function GoogleCalendarIntegrationPage({
  params,
}: GoogleCalendarIntegrationPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [lng, setLng] = useState("pt-BR")

  const [calendarIntegration, setCalendarIntegration] = useState<CalendarIntegration | null>(null)
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("")

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  const fetchIntegration = useCallback(async () => {
    try {
      setIsLoading(true)
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
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIntegration()
  }, [fetchIntegration])

  useEffect(() => {
    const calendarStatus = searchParams.get("calendar")
    if (calendarStatus !== "connected" && calendarStatus !== "error") return
    if (calendarStatus === "connected") {
      showToast.success("Google Calendar conectado com sucesso!")
    } else {
      showToast.error("Erro ao conectar Google Calendar. Tente novamente.")
    }
    const next = new URLSearchParams(searchParams.toString())
    next.delete("calendar")
    const qs = next.toString()
    router.replace(
      `/${lng}/configuracoes/integracoes/google-calendar${qs ? `?${qs}` : ""}`,
      { scroll: false },
    )
  }, [searchParams, router, lng])

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      const data = await api.getCalendarAuthURL()
      window.location.href = data.auth_url
    } catch (err) {
      handleApiError(err)
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await api.disconnectCalendar()
      setCalendarIntegration(null)
      setCalendars([])
      setSelectedCalendarId("")
      showToast.success("Google Calendar desconectado.")
    } catch (err) {
      handleApiError(err, "Falha ao desconectar")
    }
  }

  const handleSelectCalendar = async (calendarId: string) => {
    try {
      await api.setGoogleCalendar(calendarId)
      setSelectedCalendarId(calendarId)
    } catch (err) {
      handleApiError(err, "Falha ao selecionar calendário")
    }
  }

  const handleToggleSync = async () => {
    if (!calendarIntegration) return
    try {
      await api.updateCalendarSettings(
        !calendarIntegration.sync_enabled,
        calendarIntegration.sync_direction,
      )
      setCalendarIntegration({
        ...calendarIntegration,
        sync_enabled: !calendarIntegration.sync_enabled,
      })
    } catch (err) {
      handleApiError(err, "Falha ao atualizar sincronização")
    }
  }

  const isConnected = calendarIntegration?.connected ?? false

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Google Calendar" tutorialPage="configuracoes" />

      <div className="flex-1 overflow-y-auto bg-muted/10">
        <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${lng}/configuracoes?tab=integracoes`)}
            className="-ml-2 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Integrações
          </Button>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(60% 70% at 100% 0%, rgba(66,133,244,0.10), transparent 55%), radial-gradient(50% 60% at 0% 100%, rgba(52,168,83,0.07), transparent 55%)",
              }}
            />
            <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.10)] ring-1 ring-border">
                <GoogleCalendarLogo className="h-14 w-14" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Google Calendar
                  </h1>
                  {isLoading ? (
                    <span className="inline-flex h-6 w-24 animate-pulse rounded-full bg-muted" />
                  ) : isConnected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
                      Não conectado
                    </span>
                  )}
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Mantenha sua agenda do Google e os agendamentos da clínica em sincronia.
                  Crie, atualize e cancele eventos automaticamente, sem digitar duas vezes.
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : !isConnected ? (
            <Card>
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="grid gap-5 sm:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20">
                      <Zap className="h-4 w-4" />
                    </div>
                    <h3 className="font-medium">Em tempo real</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Eventos atualizados em segundos após cada agendamento.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20">
                      <RefreshCw className="h-4 w-4" />
                    </div>
                    <h3 className="font-medium">Bidirecional</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Mudanças no Google Calendar refletem aqui — e vice-versa.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20">
                      <Shield className="h-4 w-4" />
                    </div>
                    <h3 className="font-medium">Permissão mínima</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Só acessamos o calendário que você escolher.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Você será redirecionado ao Google para autorizar o acesso.
                  </p>
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    size="lg"
                    className="gap-2.5 bg-foreground text-background hover:bg-foreground/90"
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <GoogleGLogo className="h-4 w-4" />
                    )}
                    Conectar com Google
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-400/30">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Conta conectada
                      </p>
                      <p className="truncate font-medium">
                        {calendarIntegration?.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    className="shrink-0 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  >
                    Desconectar
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Calendário</CardTitle>
                  <CardDescription>
                    Escolha em qual calendário do Google os agendamentos serão criados.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedCalendarId} onValueChange={handleSelectCalendar}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione um calendário" />
                    </SelectTrigger>
                    <SelectContent>
                      {calendars.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#4285F4]" />
                            {c.summary}
                            {c.primary ? (
                              <span className="ml-1 text-[11px] font-medium text-muted-foreground">
                                · principal
                              </span>
                            ) : null}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base">Sincronização automática</CardTitle>
                      <CardDescription>
                        Atualizar o Google Calendar a cada novo agendamento.
                      </CardDescription>
                    </div>
                    <Switch
                      checked={calendarIntegration?.sync_enabled ?? false}
                      onCheckedChange={handleToggleSync}
                    />
                  </div>
                </CardHeader>
                {(calendarIntegration?.last_sync_at || calendarIntegration?.last_sync_error) && (
                  <>
                    <Separator />
                    <CardContent className="space-y-2 pt-4">
                      {calendarIntegration?.last_sync_at && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>
                            Última sincronização:{" "}
                            <span className="text-foreground">
                              {new Date(calendarIntegration.last_sync_at).toLocaleString("pt-BR")}
                            </span>
                          </span>
                        </div>
                      )}
                      {calendarIntegration?.last_sync_error && (
                        <div className="flex items-start gap-2 rounded-md bg-destructive/5 px-3 py-2 text-xs text-destructive ring-1 ring-inset ring-destructive/15">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>
                            Erro na última sincronização: {calendarIntegration.last_sync_error}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
