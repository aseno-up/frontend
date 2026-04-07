'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  UserX,
  Clock,
  CheckCircle2,
  DollarSign,
  Filter,
  TrendingDown,
  Calendar,
  MessageSquare,
  Send,
  CheckCheck,
  Reply,
  XCircle,
  AlertCircle,
  BarChart3,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/client'
import { api } from '@/lib/api/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { handleApiError, showToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface FinanceiroPageProps {
  params: Promise<{ lng: string }>
}

interface MonthlyMetrics {
  year: number
  month: number
  month_name: string
  no_shows: number
  hours_lost: number
  completed_sessions: number
  lost_revenue: number
}

interface WhatsAppMetrics {
  messages_sent: number
  delivered: number
  replied: number
  failed: number
  confirmation_timeout: number
}

interface AppointmentsSummary {
  total: number
  confirmed: number
  canceled: number
  no_response: number
  no_show: number
  completed: number
}

interface Professional {
  id: string
  name: string
  color?: string
}

interface ReportMetrics {
  period: string
  no_shows: number
  hours_lost: number
  completed_sessions: number
  estimated_lost_revenue: number
  total_revenue: number
  attendance_rate: number
  monthly_breakdown: MonthlyMetrics[]
  whatsapp_metrics?: WhatsAppMetrics
  appointments_summary?: AppointmentsSummary
}

type Period = '1m' | '3m' | '6m' | '1y'

export default function FinanceiroPage(props: FinanceiroPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [lng, setLng] = useState('pt-BR')
  const pageTab = searchParams.get('tab') || 'visao-geral'

  const setPageTab = useCallback((tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'visao-geral') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    router.push(pathname + (params.toString() ? '?' + params.toString() : ''), { scroll: false })
  }, [searchParams, pathname, router])
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('3m')
  const [isRestricted, setIsRestricted] = useState(false)
  const [professionalId, setProfessionalId] = useState<string>('all')
  const [professionals, setProfessionals] = useState<Professional[]>([])

  useEffect(() => {
    props.params.then(p => setLng(p.lng))
  }, [props.params])

  useEffect(() => {
    api.getProfessionals({ page: 1, limit: 100 }).then(res => {
      setProfessionals(res.data || [])
    }).catch(() => {})
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation(lng, 'dashboard')

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setIsRestricted(false)
      const data = await api.getReportMetrics(period, professionalId === 'all' ? undefined : professionalId)
      setMetrics(data)
    } catch (err: any) {
      if (err.response && err.response.status === 403 && err.response.data?.error?.type === 'UPGRADE_REQUIRED') {
        setIsRestricted(true)
      } else {
        handleApiError(err, "Erro ao carregar relatórios")
      }
    } finally {
      setIsLoading(false)
    }
  }, [period, professionalId])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`
  }

  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case '1m': return 'Último mês'
      case '3m': return 'Últimos 3 meses'
      case '6m': return 'Últimos 6 meses'
      case '1y': return 'Último ano'
    }
  }

  const m = metrics || {
    period: '3m',
    no_shows: 0,
    hours_lost: 0,
    completed_sessions: 0,
    estimated_lost_revenue: 0,
    total_revenue: 0,
    attendance_rate: 0,
    monthly_breakdown: [],
    whatsapp_metrics: undefined,
    appointments_summary: undefined
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Financeiro" tutorialPage="financeiro" />

      <div className="bg-background px-4 md:px-8 pt-2 border-b border-border/40 shrink-0">
        <div className="flex h-12 w-full justify-start gap-4 md:gap-6 p-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setPageTab("visao-geral")}
            className={`relative h-12 rounded-none border-b-2 bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium shadow-none transition-none flex items-center gap-2 whitespace-nowrap ${
              pageTab === "visao-geral"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-primary"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Visao Geral</span>
          </button>
          <button
            onClick={() => setPageTab("repasse")}
            className={`relative h-12 rounded-none border-b-2 bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium shadow-none transition-none flex items-center gap-2 whitespace-nowrap ${
              pageTab === "repasse"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-primary"
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Repasse</span>
          </button>
        </div>
      </div>

      {pageTab === "visao-geral" && (
        <>
          {isLoading && !metrics && !isRestricted ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : isRestricted ? (
            <div className="flex-1 p-8 flex items-center justify-center">
              <Card className="max-w-2xl w-full border-primary/20 bg-primary/5">
                <CardHeader className="text-center">
                  <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Descubra quanto sua clinica esta perdendo</CardTitle>
                  <CardDescription className="text-lg mt-2">
                    Relatorios detalhados de faltas, horas ociosas e faturamento perdido estao disponiveis no Plano Profissional.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-background p-4 rounded-lg border flex items-center gap-3">
                      <UserX className="h-5 w-5 text-red-500" />
                      <span className="font-medium">Controle de Faltas</span>
                    </div>
                    <div className="bg-background p-4 rounded-lg border flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-red-500" />
                      <span className="font-medium">Prejuizo Estimado</span>
                    </div>
                    <div className="bg-background p-4 rounded-lg border flex items-center gap-3">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">Horas Perdidas</span>
                    </div>
                    <div className="bg-background p-4 rounded-lg border flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Taxa de Comparecimento</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">Faca upgrade agora e tome decisoes baseadas em dados.</p>
                    <a href={`/${lng}/faturamento`} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                      Fazer Upgrade para Profissional
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 space-y-6 p-8 overflow-y-auto">
              {/* Filtros */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">Ultimo mes</SelectItem>
                    <SelectItem value="3m">Ultimos 3 meses</SelectItem>
                    <SelectItem value="6m">Ultimos 6 meses</SelectItem>
                    <SelectItem value="1y">Ultimo ano</SelectItem>
                  </SelectContent>
                </Select>
                {professionals.length > 0 && (
                  <Select value={professionalId} onValueChange={setProfessionalId}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Todos os profissionais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os profissionais</SelectItem>
                      {professionals.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Cards de Metricas Principais */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-sm">
                  Resumo do Periodo ({getPeriodLabel(period)})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-red-200 dark:border-red-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Faltas (No-Show)</CardTitle>
                      <UserX className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">{m.no_shows}</div>
                      <p className="text-xs text-muted-foreground mt-1">pacientes nao compareceram</p>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 dark:border-orange-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Horas Perdidas</CardTitle>
                      <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">{formatHours(m.hours_lost)}</div>
                      <p className="text-xs text-muted-foreground mt-1">de agenda desperdicadas</p>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 dark:border-green-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Sessoes Realizadas</CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{m.completed_sessions}</div>
                      <p className="text-xs text-muted-foreground mt-1">consultas concluidas</p>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Faturamento Perdido</CardTitle>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">{formatCurrency(m.estimated_lost_revenue)}</div>
                      <p className="text-xs text-red-600/80 mt-1">estimativa de receita perdida</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Resumo de Agendamentos */}
              {m.appointments_summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Resumo de Agendamentos
                    </CardTitle>
                    <CardDescription>Distribuicao dos agendamentos por status no periodo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{m.appointments_summary.total}</div>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{m.appointments_summary.confirmed}</div>
                        <p className="text-xs text-muted-foreground">Confirmados</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{m.appointments_summary.completed}</div>
                        <p className="text-xs text-muted-foreground">Realizados</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{m.appointments_summary.canceled}</div>
                        <p className="text-xs text-muted-foreground">Cancelados</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{m.appointments_summary.no_response}</div>
                        <p className="text-xs text-muted-foreground">Sem Resposta</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{m.appointments_summary.no_show}</div>
                        <p className="text-xs text-muted-foreground">No-Show</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Confirmacoes WhatsApp */}
              {m.whatsapp_metrics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      Confirmacoes WhatsApp
                    </CardTitle>
                    <CardDescription>Metricas de mensagens de confirmacao enviadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Send className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-2xl font-bold">{m.whatsapp_metrics.messages_sent}</div>
                        <p className="text-xs text-muted-foreground">Enviadas</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <CheckCheck className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                        <div className="text-2xl font-bold text-blue-600">{m.whatsapp_metrics.delivered}</div>
                        <p className="text-xs text-muted-foreground">Entregues</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <Reply className="h-5 w-5 mx-auto mb-1 text-green-600" />
                        <div className="text-2xl font-bold text-green-600">{m.whatsapp_metrics.replied}</div>
                        <p className="text-xs text-muted-foreground">Respondidas</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
                        <div className="text-2xl font-bold text-red-600">{m.whatsapp_metrics.failed}</div>
                        <p className="text-xs text-muted-foreground">Falharam</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <AlertCircle className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                        <div className="text-2xl font-bold text-orange-600">{m.whatsapp_metrics.confirmation_timeout}</div>
                        <p className="text-xs text-muted-foreground">Ignoradas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Taxa de Comparecimento */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Taxa de Comparecimento
                  </CardTitle>
                  <CardDescription>Proporcao de pacientes que compareceram as consultas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold">{m.attendance_rate.toFixed(1)}%</div>
                    <div className="flex-1">
                      <div className="w-full bg-secondary h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${m.attendance_rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    De cada 100 consultas agendadas, {m.attendance_rate.toFixed(0)} pacientes comparecem
                  </p>
                </CardContent>
              </Card>

              {/* Detalhamento Mensal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Detalhamento Mensal
                  </CardTitle>
                  <CardDescription>Evolucao mes a mes das metricas</CardDescription>
                </CardHeader>
                <CardContent>
                  {(m.monthly_breakdown || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum dado disponivel para o periodo selecionado.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mes</TableHead>
                          <TableHead className="text-center">Faltas</TableHead>
                          <TableHead className="text-center">Horas Perdidas</TableHead>
                          <TableHead className="text-center">Sessoes</TableHead>
                          <TableHead className="text-right">Faturamento Perdido</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {m.monthly_breakdown.map((month, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{month.month_name}/{month.year}</TableCell>
                            <TableCell className="text-center">
                              <span className={month.no_shows > 0 ? "text-red-600 font-semibold" : ""}>{month.no_shows}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={month.hours_lost > 0 ? "text-orange-600" : ""}>{formatHours(month.hours_lost)}</span>
                            </TableCell>
                            <TableCell className="text-center text-green-600">{month.completed_sessions}</TableCell>
                            <TableCell className="text-right">
                              <span className={month.lost_revenue > 0 ? "text-red-600 font-semibold" : ""}>{formatCurrency(month.lost_revenue)}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {pageTab === "repasse" && (
        <RepasseTab />
      )}
    </div>
  )
}

// --- Repasse Tab Component ---

interface CommissionSummary {
  professionals: Array<{
    professional_id: string
    professional_name: string
    professional_color: string
    total_sessions: number
    total_commission: number
    total_paid: number
    total_pending: number
  }>
  total_sessions: number
  total_commission: number
  total_paid: number
  total_pending: number
}

interface CommissionDetail {
  id: string
  appointment_id: string
  appointment_date: string
  patient_name: string
  procedure_name: string
  session_price: number
  commission_type: string
  commission_rate: number
  commission_value: number
  status: 'pending' | 'paid'
  paid_at?: string
}

function RepasseTab() {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [month, setMonth] = useState(defaultMonth)
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null)
  const [details, setDetails] = useState<CommissionDetail[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const fetchSummary = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.getCommissionSummary({ month })
      setSummary(data)
    } catch (error) {
      handleApiError(error, 'Erro ao carregar resumo de repasse')
    } finally {
      setIsLoading(false)
    }
  }, [month])

  useEffect(() => {
    fetchSummary()
    setSelectedProfId(null)
    setDetails([])
  }, [fetchSummary])

  const fetchDetails = useCallback(async (profId: string) => {
    setDetailsLoading(true)
    setSelectedIds(new Set())
    try {
      const data = await api.getCommissionReport(profId, { month })
      setDetails(data || [])
    } catch (error) {
      handleApiError(error, 'Erro ao carregar detalhes de repasse')
    } finally {
      setDetailsLoading(false)
    }
  }, [month])

  const handleProfClick = (profId: string) => {
    if (selectedProfId === profId) {
      setSelectedProfId(null)
      setDetails([])
    } else {
      setSelectedProfId(profId)
      fetchDetails(profId)
    }
  }

  const handlePaySelected = async () => {
    if (selectedIds.size === 0 || !selectedProfId) return
    setIsMarking(true)
    try {
      await api.bulkPayCommissions(Array.from(selectedIds))
      showToast.success(`${selectedIds.size} repasse(s) marcado(s) como pago(s)!`)
      setSelectedIds(new Set())
      fetchSummary()
      fetchDetails(selectedProfId)
    } catch (error) {
      handleApiError(error, 'Erro ao marcar repasses como pagos')
    } finally {
      setIsMarking(false)
    }
  }

  const pendingDetails = details.filter(d => d.status === 'pending')

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(pendingDetails.map(d => d.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleMarkAllPaid = async (profId: string) => {
    setIsMarking(true)
    try {
      await api.markAllCommissionsPaid(profId, month)
      showToast.success('Repasses marcados como pagos!')
      fetchSummary()
      fetchDetails(profId)
    } catch (error) {
      handleApiError(error, 'Erro ao marcar repasses como pagos')
    } finally {
      setIsMarking(false)
    }
  }

  // Month selector options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const raw = summary || { professionals: null, total_sessions: 0, total_commission: 0, total_paid: 0, total_pending: 0 }
  const s = { ...raw, professionals: raw.professionals || [] }

  return (
    <div className="flex-1 space-y-6 p-8 overflow-y-auto">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Selecione o mes" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessoes com Repasse</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{s.total_sessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repasse</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(s.total_commission)}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Pago</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{formatCurrency(s.total_paid)}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{formatCurrency(s.total_pending)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Consolidated table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Repasse Consolidado</CardTitle>
          <CardDescription>Clique em um profissional para ver o detalhamento das sessoes.</CardDescription>
        </CardHeader>
        <CardContent>
          {s.professionals.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">Nenhum repasse registrado neste periodo. Repasses sao calculados automaticamente ao marcar sessoes como concluidas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead className="text-center">Sessoes</TableHead>
                  <TableHead className="text-right">Total Repasse</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="text-right">Pendente</TableHead>
                  <TableHead className="text-right">Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.professionals.map((prof) => (
                  <TableRow
                    key={prof.professional_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleProfClick(prof.professional_id)}
                  >
                    <TableCell>
                      {selectedProfId === prof.professional_id
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                          style={{ backgroundColor: prof.professional_color || '#7C3AED' }}
                        >
                          {prof.professional_name.split(' ').filter((n: string) => n.length > 0).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <span className="font-medium">{prof.professional_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{prof.total_sessions}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(prof.total_commission)}</TableCell>
                    <TableCell className="text-right text-emerald-600">{formatCurrency(prof.total_paid)}</TableCell>
                    <TableCell className="text-right text-orange-600">{formatCurrency(prof.total_pending)}</TableCell>
                    <TableCell className="text-right">
                      {prof.total_pending > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isMarking}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAllPaid(prof.professional_id)
                          }}
                        >
                          {isMarking ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Pagar tudo'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total row */}
                <TableRow className="bg-muted/30 font-bold">
                  <TableCell></TableCell>
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-center">{s.total_sessions}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.total_commission)}</TableCell>
                  <TableCell className="text-right text-emerald-600">{formatCurrency(s.total_paid)}</TableCell>
                  <TableCell className="text-right text-orange-600">{formatCurrency(s.total_pending)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed report for selected professional */}
      {selectedProfId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Detalhamento — {s.professionals.find(p => p.professional_id === selectedProfId)?.professional_name}
              </CardTitle>
              <CardDescription>Sessoes realizadas no periodo com repasse calculado.</CardDescription>
            </div>
            {selectedIds.size > 0 && (
              <Button onClick={handlePaySelected} disabled={isMarking} size="sm">
                {isMarking ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                Pagar {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''} ({formatCurrency(
                  details.filter(d => selectedIds.has(d.id)).reduce((sum, d) => sum + d.commission_value, 0)
                )})
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : details.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">Nenhuma sessao com repasse neste periodo.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      {pendingDetails.length > 0 && (
                        <input
                          type="checkbox"
                          checked={pendingDetails.length > 0 && selectedIds.size === pendingDetails.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 rounded border-input"
                          title="Selecionar todos pendentes"
                        />
                      )}
                    </TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead className="text-right">Valor Sessao</TableHead>
                    <TableHead>Repasse</TableHead>
                    <TableHead className="text-right">Valor Repasse</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.map((d) => (
                    <TableRow key={d.id} className={selectedIds.has(d.id) ? 'bg-primary/5' : ''}>
                      <TableCell>
                        {d.status === 'pending' ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(d.id)}
                            onChange={(e) => handleSelectOne(d.id, e.target.checked)}
                            className="h-4 w-4 rounded border-input"
                          />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(d.appointment_date)}</TableCell>
                      <TableCell>{d.patient_name}</TableCell>
                      <TableCell>{d.procedure_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(d.session_price)}</TableCell>
                      <TableCell>
                        {d.commission_type === 'percentage'
                          ? `${d.commission_rate}%`
                          : formatCurrency(d.commission_rate)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(d.commission_value)}</TableCell>
                      <TableCell>
                        {d.status === 'paid' ? (
                          <Badge variant="success">Pago</Badge>
                        ) : (
                          <Badge variant="warning">Pendente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Detail total row */}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell></TableCell>
                    <TableCell colSpan={3}>TOTAL PERIODO</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(details.reduce((sum, d) => sum + d.session_price, 0))}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(details.reduce((sum, d) => sum + d.commission_value, 0))}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">
                        Pago: {formatCurrency(details.filter(d => d.status === 'paid').reduce((sum, d) => sum + d.commission_value, 0))}
                        {' | '}
                        Pend: {formatCurrency(details.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.commission_value, 0))}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
