'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Clock,
  CheckCircle2,
  DollarSign,
  Filter,
  Calendar,
  MessageSquare,
  BarChart3,
  Loader2,
  ChevronDown,
  ChevronRight,
  Receipt,
  Wallet,
  ShieldCheck,
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
            onClick={() => setPageTab("recebiveis")}
            className={`relative h-12 rounded-none border-b-2 bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium shadow-none transition-none flex items-center gap-2 whitespace-nowrap ${
              pageTab === "recebiveis"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-primary"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Recebiveis</span>
          </button>
          <button
            onClick={() => setPageTab("caixa")}
            className={`relative h-12 rounded-none border-b-2 bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium shadow-none transition-none flex items-center gap-2 whitespace-nowrap ${
              pageTab === "caixa"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-primary"
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Caixa</span>
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
          <button
            onClick={() => setPageTab("conciliacao")}
            className={`relative h-12 rounded-none border-b-2 bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium shadow-none transition-none flex items-center gap-2 whitespace-nowrap ${
              pageTab === "conciliacao"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-primary"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Conciliacao</span>
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
            <UpgradeCard title="Descubra quanto sua clinica esta perdendo" description="Relatorios detalhados de faltas, horas ociosas e faturamento perdido estao disponiveis no Plano Profissional." />
          ) : (
            <div className="flex-1 p-8 overflow-y-auto space-y-8">
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

              {/* Hero: Faturamento Perdido + Taxa de Comparecimento */}
              <div className="py-4 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Faturamento Perdido</p>
                  <p className="text-4xl md:text-5xl font-bold tracking-tight text-red-600">{formatCurrency(m.estimated_lost_revenue)}</p>
                  <p className="text-sm text-muted-foreground mt-2">nos {getPeriodLabel(period)?.toLowerCase()}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Taxa de Comparecimento</p>
                  <p className="text-3xl font-bold">{m.attendance_rate.toFixed(1)}%</p>
                  <div className="w-48 bg-secondary h-2 rounded-full overflow-hidden mt-2">
                    <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${m.attendance_rate}%` }} />
                  </div>
                </div>
              </div>

              {/* Inline secondary metrics */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground pb-6 border-b flex-wrap">
                <span><strong className="text-red-600">{m.no_shows}</strong> faltas</span>
                <span className="text-border">|</span>
                <span><strong className="text-orange-600">{formatHours(m.hours_lost)}</strong> horas perdidas</span>
                <span className="text-border">|</span>
                <span><strong className="text-green-600">{m.completed_sessions}</strong> sessoes realizadas</span>
              </div>

              {/* Two-column detail: Agendamentos + WhatsApp */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Agendamentos */}
                {m.appointments_summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Agendamentos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                      {[
                        { label: 'Total', value: m.appointments_summary.total, color: '' },
                        { label: 'Confirmados', value: m.appointments_summary.confirmed, color: 'text-green-600' },
                        { label: 'Realizados', value: m.appointments_summary.completed, color: 'text-blue-600' },
                        { label: 'Cancelados', value: m.appointments_summary.canceled, color: 'text-red-600' },
                        { label: 'Sem Resposta', value: m.appointments_summary.no_response, color: 'text-orange-600' },
                        { label: 'No-Show', value: m.appointments_summary.no_show, color: 'text-red-600' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.color ? item.color.replace('text-', 'bg-') : 'bg-muted-foreground'}`} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* WhatsApp */}
                {m.whatsapp_metrics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                        Confirmacoes WhatsApp
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                      {[
                        { label: 'Enviadas', value: m.whatsapp_metrics.messages_sent, color: '' },
                        { label: 'Entregues', value: m.whatsapp_metrics.delivered, color: 'text-blue-600' },
                        { label: 'Respondidas', value: m.whatsapp_metrics.replied, color: 'text-green-600' },
                        { label: 'Falharam', value: m.whatsapp_metrics.failed, color: 'text-red-600' },
                        { label: 'Ignoradas', value: m.whatsapp_metrics.confirmation_timeout, color: 'text-orange-600' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.color ? item.color.replace('text-', 'bg-') : 'bg-muted-foreground'}`} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Detalhamento Mensal */}
              {(m.monthly_breakdown || []).length > 0 && (
                <div>
                  <h3 className="text-base font-medium mb-1">Detalhamento Mensal</h3>
                  <p className="text-sm text-muted-foreground mb-4">Evolucao mes a mes das metricas</p>
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
                      <TableRow className="bg-muted/30 font-bold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-center text-red-600">{m.no_shows}</TableCell>
                        <TableCell className="text-center text-orange-600">{formatHours(m.hours_lost)}</TableCell>
                        <TableCell className="text-center text-green-600">{m.completed_sessions}</TableCell>
                        <TableCell className="text-right text-red-600">{formatCurrency(m.estimated_lost_revenue)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {pageTab === "recebiveis" && (
        <RecebiveisTab parentRestricted={isRestricted} />
      )}

      {pageTab === "caixa" && (
        <CaixaTab />
      )}

      {pageTab === "repasse" && (
        <RepasseTab />
      )}

      {pageTab === "conciliacao" && (
        <ConciliacaoTab parentRestricted={isRestricted} />
      )}
    </div>
  )
}

// --- Financial Report Types ---

interface FinancialSummary {
  total_expected: number
  total_received: number
  total_pending: number
  total_discount: number
  total_sessions: number
  paid_sessions: number
  pending_sessions: number
  conciliation_rate: number
}

interface DailyReceivable {
  date: string
  sessions: number
  expected: number
  received: number
  pending: number
}

interface PaymentMethodBreakdownItem {
  method_name: string
  method_type: string
  total: number
  count: number
  percentage: number
}

interface UnconciliatedAppointment {
  appointment_id: string
  date: string
  patient_name: string
  professional_name: string
  price: number
  payment_status: string
}

interface FinancialReport {
  summary: FinancialSummary
  daily_breakdown: DailyReceivable[]
  payment_method_breakdown: PaymentMethodBreakdownItem[]
  unconciliated_appointments: UnconciliatedAppointment[]
}

function useFinancialReport() {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [month, setMonth] = useState(defaultMonth)
  const [professionalId, setProfessionalId] = useState<string>('all')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [report, setReport] = useState<FinancialReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.getProfessionals({ page: 1, limit: 100 }).then(res => {
      setProfessionals(res.data || [])
    }).catch(() => {})
  }, [])

  const fetchReport = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.getFinancialReport({
        month,
        professional_id: professionalId === 'all' ? undefined : professionalId,
      })
      setReport(data)
    } catch (err) {
      handleApiError(err, 'Erro ao carregar relatório financeiro')
    } finally {
      setIsLoading(false)
    }
  }, [month, professionalId])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) }
  })

  return { month, setMonth, professionalId, setProfessionalId, professionals, report, isLoading, monthOptions }
}

const formatCurrencyShared = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const formatDateShared = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function UpgradeCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex-1 p-8 flex items-center justify-center">
      <Card className="max-w-lg w-full border-primary/20 bg-primary/5">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <CardDescription className="text-base mt-2">{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <a href="/pt-BR/faturamento" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
            Fazer Upgrade para Profissional
          </a>
        </CardContent>
      </Card>
    </div>
  )
}

function FinancialFilters({
  month, setMonth, professionalId, setProfessionalId, professionals, monthOptions,
}: {
  month: string
  setMonth: (v: string) => void
  professionalId: string
  setProfessionalId: (v: string) => void
  professionals: Professional[]
  monthOptions: { value: string; label: string }[]
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
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
  )
}

// --- Recebiveis Tab ---

function RecebiveisTab({ parentRestricted }: { parentRestricted: boolean }) {
  const { month, setMonth, professionalId, setProfessionalId, professionals, report, isLoading, monthOptions } = useFinancialReport()

  if (parentRestricted) {
    return <UpgradeCard title="Controle de Recebiveis" description="Acompanhe receita esperada, recebida e pendente por periodo. Disponivel no Plano Profissional." />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const s = report?.summary || { total_expected: 0, total_received: 0, total_pending: 0, total_discount: 0, total_sessions: 0, paid_sessions: 0, pending_sessions: 0, conciliation_rate: 0 }
  const daily = report?.daily_breakdown || []
  const methods = report?.payment_method_breakdown || []

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      <FinancialFilters month={month} setMonth={setMonth} professionalId={professionalId} setProfessionalId={setProfessionalId} professionals={professionals} monthOptions={monthOptions} />

      {/* Hero number */}
      <div className="py-4 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Receita Esperada</p>
          <p className="text-4xl md:text-5xl font-bold tracking-tight">{formatCurrencyShared(s.total_expected)}</p>
        </div>
        <div className="md:text-right">
          <p className="text-sm font-medium text-muted-foreground mb-1">Recebido</p>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrencyShared(s.total_received)}</p>
        </div>
      </div>

      {/* Inline metrics */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground pb-6 border-b flex-wrap">
        <span><strong className="text-foreground">{s.total_sessions}</strong> sessoes</span>
        <span className="text-border">|</span>
        <span><strong className="text-emerald-600">{formatCurrencyShared(s.total_received)}</strong> recebido</span>
        <span className="text-border">|</span>
        <span><strong className="text-orange-600">{formatCurrencyShared(s.total_pending)}</strong> pendente</span>
        {s.total_discount > 0 && (
          <>
            <span className="text-border">|</span>
            <span><strong className="text-muted-foreground">{formatCurrencyShared(s.total_discount)}</strong> descontos</span>
          </>
        )}
      </div>

      {/* Payment method breakdown */}
      {methods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Por Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {methods.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="text-sm truncate">{m.method_name}</span>
                  <Badge variant="outline" className="text-xs shrink-0">{m.method_type}</Badge>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden hidden sm:block">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${m.percentage}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{m.percentage.toFixed(0)}%</span>
                  <span className="text-sm font-semibold w-28 text-right">{formatCurrencyShared(m.total)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Daily breakdown table */}
      {daily.length > 0 && (
        <div>
          <h3 className="text-base font-medium mb-1">Detalhamento Diario</h3>
          <p className="text-sm text-muted-foreground mb-4">Receitas registradas por dia no periodo</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-center">Sessoes</TableHead>
                <TableHead className="text-right">Esperado</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daily.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{formatDateShared(d.date)}</TableCell>
                  <TableCell className="text-center">{d.sessions}</TableCell>
                  <TableCell className="text-right">{formatCurrencyShared(d.expected)}</TableCell>
                  <TableCell className="text-right text-emerald-600">{formatCurrencyShared(d.received)}</TableCell>
                  <TableCell className="text-right">
                    <span className={d.pending > 0 ? 'text-orange-600 font-semibold' : ''}>{formatCurrencyShared(d.pending)}</span>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-center">{daily.reduce((a, d) => a + d.sessions, 0)}</TableCell>
                <TableCell className="text-right">{formatCurrencyShared(daily.reduce((a, d) => a + d.expected, 0))}</TableCell>
                <TableCell className="text-right text-emerald-600">{formatCurrencyShared(daily.reduce((a, d) => a + d.received, 0))}</TableCell>
                <TableCell className="text-right text-orange-600">{formatCurrencyShared(daily.reduce((a, d) => a + d.pending, 0))}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {daily.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground py-4">Nenhuma sessao concluida neste periodo.</p>
      )}
    </div>
  )
}

// --- Caixa Tab ---

function CaixaTab() {
  const { month, setMonth, professionalId, setProfessionalId, professionals, report, isLoading, monthOptions } = useFinancialReport()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const s = report?.summary || { total_expected: 0, total_received: 0, total_pending: 0, total_discount: 0, total_sessions: 0, paid_sessions: 0, pending_sessions: 0, conciliation_rate: 0 }
  const daily = report?.daily_breakdown || []
  const methods = report?.payment_method_breakdown || []

  const daysWithMovement = daily.filter(d => d.received > 0).length
  const avgDaily = daysWithMovement > 0 ? s.total_received / daysWithMovement : 0

  // Calculate accumulated values (reverse order since daily is DESC)
  const dailyWithAccumulated = [...daily].reverse().reduce<(DailyReceivable & { accumulated: number })[]>((acc, d) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].accumulated : 0
    acc.push({ ...d, accumulated: prev + d.received })
    return acc
  }, []).reverse()

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      <FinancialFilters month={month} setMonth={setMonth} professionalId={professionalId} setProfessionalId={setProfessionalId} professionals={professionals} monthOptions={monthOptions} />

      {/* Hero number */}
      <div className="py-4">
        <p className="text-sm font-medium text-muted-foreground mb-1">Total Recebido</p>
        <p className="text-4xl md:text-5xl font-bold tracking-tight text-emerald-600">{formatCurrencyShared(s.total_received)}</p>
      </div>

      {/* Inline metrics */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground pb-6 border-b flex-wrap">
        <span>media <strong className="text-foreground">{formatCurrencyShared(avgDaily)}</strong>/dia</span>
        <span className="text-border">|</span>
        <span><strong className="text-foreground">{daysWithMovement}</strong> dias com movimento</span>
        <span className="text-border">|</span>
        <span><strong className="text-foreground">{s.paid_sessions}</strong> sessoes pagas</span>
      </div>

      {/* Payment method breakdown */}
      {methods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Entradas por Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {methods.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-sm truncate">{m.method_name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{m.count} pgto{m.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden hidden sm:block">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${m.percentage}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{m.percentage.toFixed(0)}%</span>
                  <span className="text-sm font-semibold w-28 text-right">{formatCurrencyShared(m.total)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Daily movement table */}
      {dailyWithAccumulated.length > 0 && (
        <div>
          <h3 className="text-base font-medium mb-1">Movimentacao Diaria</h3>
          <p className="text-sm text-muted-foreground mb-4">Entradas registradas por dia</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-center">Sessoes</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Acumulado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyWithAccumulated.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{formatDateShared(d.date)}</TableCell>
                  <TableCell className="text-center">{d.sessions}</TableCell>
                  <TableCell className="text-right text-emerald-600">{formatCurrencyShared(d.received)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrencyShared(d.accumulated)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {daily.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground py-4">Nenhuma entrada registrada neste periodo.</p>
      )}
    </div>
  )
}

// --- Conciliacao Tab ---

function ConciliacaoTab({ parentRestricted }: { parentRestricted: boolean }) {
  const { month, setMonth, professionalId, setProfessionalId, professionals, report, isLoading, monthOptions } = useFinancialReport()

  if (parentRestricted) {
    return <UpgradeCard title="Conciliacao Financeira" description="Identifique sessoes concluidas sem pagamento registrado. Disponivel no Plano Profissional." />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const s = report?.summary || { total_expected: 0, total_received: 0, total_pending: 0, total_discount: 0, total_sessions: 0, paid_sessions: 0, pending_sessions: 0, conciliation_rate: 0 }
  const unconciliated = report?.unconciliated_appointments || []

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      <FinancialFilters month={month} setMonth={setMonth} professionalId={professionalId} setProfessionalId={setProfessionalId} professionals={professionals} monthOptions={monthOptions} />

      {/* Hero number */}
      <div className="py-4 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Taxa de Conciliacao</p>
          <p className={`text-4xl md:text-5xl font-bold tracking-tight ${s.conciliation_rate >= 90 ? 'text-emerald-600' : s.conciliation_rate >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
            {s.conciliation_rate.toFixed(1)}%
          </p>
        </div>
        <div className="md:text-right">
          <div className="w-48 bg-secondary h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${s.conciliation_rate >= 90 ? 'bg-emerald-500' : s.conciliation_rate >= 70 ? 'bg-orange-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(s.conciliation_rate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Inline metrics */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground pb-6 border-b flex-wrap">
        <span><strong className="text-foreground">{s.total_sessions}</strong> sessoes concluidas</span>
        <span className="text-border">|</span>
        <span><strong className="text-emerald-600">{s.paid_sessions}</strong> com pagamento</span>
        <span className="text-border">|</span>
        <span><strong className="text-orange-600">{s.pending_sessions}</strong> sem pagamento</span>
      </div>

      {/* Unconciliated appointments table */}
      {unconciliated.length > 0 ? (
        <div>
          <h3 className="text-base font-medium mb-1">Sessoes Sem Pagamento</h3>
          <p className="text-sm text-muted-foreground mb-4">Consultas concluidas que ainda nao tem pagamento completo registrado</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unconciliated.map((a) => (
                <TableRow key={a.appointment_id}>
                  <TableCell className="font-medium">{formatDateShared(a.date)}</TableCell>
                  <TableCell>{a.patient_name}</TableCell>
                  <TableCell>{a.professional_name}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrencyShared(a.price)}</TableCell>
                  <TableCell>
                    <Badge variant={a.payment_status === 'partial' ? 'warning' : 'destructive'}>
                      {a.payment_status === 'partial' ? 'Parcial' : 'Pendente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-bold">
                <TableCell colSpan={3}>TOTAL</TableCell>
                <TableCell className="text-right">{formatCurrencyShared(unconciliated.reduce((a, u) => a + u.price, 0))}</TableCell>
                <TableCell>{unconciliated.length} sessao(oes)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12">
          <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-lg font-medium">Tudo conciliado!</p>
          <p className="text-sm text-muted-foreground">Todas as sessoes concluidas tem pagamento registrado.</p>
        </div>
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
  appointment_id?: string | null
  session_plan_id?: string | null
  session_date?: string
  appointment_date: string
  patient_name: string
  procedure_name: string
  session_price: number
  commission_type: string
  commission_rate: number
  commission_value: number
  status: 'pending' | 'paid'
  paid_at?: string
  source?: 'appointment' | 'group_session'
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
                      <TableCell>
                        {d.source === 'group_session' ? (
                          <span className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">Grupo</Badge>
                            {d.session_date || 'Sessão de grupo'}
                          </span>
                        ) : d.patient_name}
                      </TableCell>
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
