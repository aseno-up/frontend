'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  UserX,
  Clock,
  CheckCircle2,
  DollarSign,
  Filter,
  TrendingDown,
  Calendar
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/client'
import { api } from '@/lib/api/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { handleApiError } from '@/lib/toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ReportPageProps {
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

interface ReportMetrics {
  period: string
  no_shows: number
  hours_lost: number
  completed_sessions: number
  estimated_lost_revenue: number
  total_revenue: number
  attendance_rate: number
  monthly_breakdown: MonthlyMetrics[]
}

type Period = '1m' | '3m' | '6m' | '1y'

export default function RelatoriosPage(props: ReportPageProps) {
  const [lng, setLng] = useState('pt-BR')
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('3m')
  const [isRestricted, setIsRestricted] = useState(false)

  useEffect(() => {
    props.params.then(p => setLng(p.lng))
  }, [props.params])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation(lng, 'dashboard')

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setIsRestricted(false)
      const data = await api.getReportMetrics(period)
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
  }, [period])

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

  if (isLoading && !metrics && !isRestricted) {
    return (
      <div className="flex h-full flex-col space-y-6 p-8">
        <Header lng={lng} title="Relatórios" />
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (isRestricted) {
    return (
      <div className="flex h-full flex-col">
        <Header lng={lng} title="Relatórios" />
        <div className="flex-1 p-8 flex items-center justify-center">
          <Card className="max-w-2xl w-full border-primary/20 bg-primary/5">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Descubra quanto sua clínica está perdendo</CardTitle>
              <CardDescription className="text-lg mt-2">
                Relatórios detalhados de faltas, horas ociosas e faturamento perdido estão disponíveis no Plano Profissional.
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
                  <span className="font-medium">Prejuízo Estimado</span>
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
                <p className="text-muted-foreground mb-4">Faça upgrade agora e tome decisões baseadas em dados.</p>
                <a href={`/${lng}/faturamento`} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                  Fazer Upgrade para Profissional
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const m = metrics || {
    period: '3m',
    no_shows: 0,
    hours_lost: 0,
    completed_sessions: 0,
    estimated_lost_revenue: 0,
    total_revenue: 0,
    attendance_rate: 0,
    monthly_breakdown: []
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Relatórios">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Último mês</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Header>

      <div className="flex-1 space-y-6 p-8 overflow-y-auto">
        {/* Cards de Métricas Principais */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-sm">
            Resumo do Período ({getPeriodLabel(period)})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Faltas */}
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Faltas (No-Show)
                </CardTitle>
                <UserX className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{m.no_shows}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  pacientes não compareceram
                </p>
              </CardContent>
            </Card>

            {/* Horas Perdidas */}
            <Card className="border-orange-200 dark:border-orange-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Horas Perdidas
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{formatHours(m.hours_lost)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  de agenda desperdiçadas
                </p>
              </CardContent>
            </Card>

            {/* Sessões Realizadas */}
            <Card className="border-green-200 dark:border-green-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sessões Realizadas
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{m.completed_sessions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  consultas concluídas
                </p>
              </CardContent>
            </Card>

            {/* Faturamento Perdido */}
            <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                  Faturamento Perdido
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{formatCurrency(m.estimated_lost_revenue)}</div>
                <p className="text-xs text-red-600/80 mt-1">
                  estimativa de receita perdida
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Taxa de Comparecimento */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Taxa de Comparecimento
              </CardTitle>
              <CardDescription>
                Proporção de pacientes que compareceram às consultas
              </CardDescription>
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
        </div>

        {/* Detalhamento Mensal */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Detalhamento Mensal
              </CardTitle>
              <CardDescription>
                Evolução mês a mês das métricas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {m.monthly_breakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum dado disponível para o período selecionado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-center">Faltas</TableHead>
                      <TableHead className="text-center">Horas Perdidas</TableHead>
                      <TableHead className="text-center">Sessões</TableHead>
                      <TableHead className="text-right">Faturamento Perdido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {m.monthly_breakdown.map((month, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {month.month_name}/{month.year}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={month.no_shows > 0 ? "text-red-600 font-semibold" : ""}>
                            {month.no_shows}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={month.hours_lost > 0 ? "text-orange-600" : ""}>
                            {formatHours(month.hours_lost)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-green-600">
                          {month.completed_sessions}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={month.lost_revenue > 0 ? "text-red-600 font-semibold" : ""}>
                            {formatCurrency(month.lost_revenue)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
