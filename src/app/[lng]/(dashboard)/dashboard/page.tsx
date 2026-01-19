'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  CalendarCheck,
  UserX,
  Users,
  TrendingUp,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Filter
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/client'
import { api } from '@/lib/api/client'
import { DashboardMetrics } from '@/types/api'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { handleApiError } from '@/lib/toast'
import { OnboardingButton } from '@/components/onboarding/onboarding-button'

interface DashboardPageProps {
  params: Promise<{ lng: string }>
}

type DateRange = 'current_month' | 'last_month' | 'last_30_days' | 'last_60_days'

export default function DashboardPage(props: DashboardPageProps) {
  const [lng, setLng] = useState('pt-BR')
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('current_month')

  // Unwrap params
  useEffect(() => {
    props.params.then(p => setLng(p.lng))
  }, [props.params])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation(lng, 'dashboard')

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const now = new Date()
      let start: Date
      let end: Date = now

      switch (dateRange) {
        case 'current_month':
          start = startOfMonth(now)
          break
        case 'last_month':
          start = startOfMonth(subMonths(now, 1))
          end = endOfMonth(subMonths(now, 1))
          break
        case 'last_30_days':
          start = subDays(now, 30)
          break
        case 'last_60_days':
          start = subDays(now, 60)
          break
        default:
          start = startOfMonth(now)
      }

      const data = await api.getDashboardMetrics(
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      )
      setMetrics(data)
    } catch (err) {
      handleApiError(err, "Erro ao carregar dashboard")
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (isLoading && !metrics) {
    return (
       <div className="flex h-full flex-col space-y-6 p-8">
         <Header lng={lng} title="Visão Geral" tutorialPage="dashboard" />
         <div className="flex items-center justify-center h-64">
           <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
         </div>
       </div>
    )
  }

  // Use empty/zero metrics if null to avoid crash
  const m = metrics || {
    estimated_revenue: 0,
    completed_consultations: 0,
    confirmed_consultations: 0,
    no_shows: 0,
    attendance_rate: 0,
    previous_attendance_rate: 0,
    estimated_lost_revenue: 0,
    agenda_occupancy: 0,
    open_slots: 0,
    future_sessions: 0,
    potential_revenue: 0,
    avoided_no_shows: 0,
    auto_confirmed: 0,
    preserved_revenue: 0,
    annual_savings_projection: 0,
    top_absentees: [],
    insights: [],
    smart_insights: []
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Visão Geral" tutorialPage="dashboard">
        <div className="flex items-center gap-2">
          <OnboardingButton lng={lng} />
           <Filter className="h-4 w-4 text-muted-foreground" />
           <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Mês Atual</SelectItem>
              <SelectItem value="last_month">Mês Passado</SelectItem>
              <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
              <SelectItem value="last_60_days">Últimos 60 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Header>

      <div className="flex-1 space-y-6 p-8 overflow-y-auto">

        {/* Bloco 1 - Visão Rápida */}
        <div data-tutorial="stats-cards">
        <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-sm">Operacional & Financeiro</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Faturamento Estimado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(m.estimated_revenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Baseado apenas em consultas realizadas e confirmadas
              </p>
            </CardContent>
          </Card>
          
          <Card data-tutorial="attendance-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Comparecimento
              </CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.attendance_rate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                 {m.previous_attendance_rate > 0 && (
                   <span className={m.attendance_rate >= m.previous_attendance_rate ? "text-green-600" : "text-red-500"}>
                     {m.attendance_rate >= m.previous_attendance_rate ? "↑" : "↓"} Média anterior: {m.previous_attendance_rate.toFixed(1)}%
                   </span>
                 )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Faltas (No-Show)
              </CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.no_shows}</div>
              <p className="text-xs text-red-500 mt-1 font-medium">
                ≈ {formatCurrency(m.estimated_lost_revenue)} perdidos
              </p>
            </CardContent>
          </Card>

           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Consultas Confirmadas
              </CardTitle>
              <CalendarCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.confirmed_consultations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Agendadas no período
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bloco 2 - Agenda e Ocupação */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-sm">Agenda & Ocupação</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ocupação da Agenda
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.agenda_occupancy.toFixed(1)}%</div>
              <div className="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${m.agenda_occupancy}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {(100 - m.agenda_occupancy).toFixed(1)}% vazia ≈ {formatCurrency(m.potential_revenue)} oportunidade
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Horários Vagos
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.open_slots}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Potencial de {formatCurrency(m.potential_revenue)} se preenchidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sessões Futuras
              </CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.future_sessions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total agendado adiante
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bloco 3 - Impacto da Automação */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Impacto da Automação (WhatsApp)
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                Confirmadas Automaticamente
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{m.auto_confirmed}</div>
              <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                Sem intervenção humana
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Faltas Evitadas
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{m.avoided_no_shows}</div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                Lembretes recuperados (est.)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-transparent" data-tutorial="revenue-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">
                Receita Preservada
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(m.preserved_revenue)}</div>
              <p className="text-xs text-primary/80 mt-1">
                Sem automação, essas consultas seriam perdidas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/20 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Projeção Anual
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(m.annual_savings_projection)}</div>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                Economia estimada se manter essa taxa
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bloco 4 - Insights e Problemas */}
      <div className="grid gap-6 md:grid-cols-2">
         {/* Ranking de Pacientes */}
         <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Ranking de Faltas</CardTitle>
              <CardDescription>Pacientes que mais faltam no período</CardDescription>
            </CardHeader>
            <CardContent>
              {(!m.top_absentees || m.top_absentees.length === 0) ? (
                <p className="text-sm text-muted-foreground">Nenhuma falta registrada no período.</p>
              ) : (
                <div className="space-y-4">
                  {m.top_absentees.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-xs">
                           {i + 1}
                         </div>
                         <span className="text-sm font-medium">{p.name}</span>
                      </div>
                      <span className="text-sm text-red-600 font-bold">{p.absent_count} faltas</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-2">
                    {m.top_absentees.length} pacientes concentram a maioria das faltas.
                  </p>
                </div>
              )}
            </CardContent>
         </Card>

         {/* Insights da IA */}
         <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
               <CardTitle className="text-base font-medium flex items-center gap-2">
                 <div className="p-1 rounded bg-primary text-primary-foreground">
                   <Users className="h-3 w-3" />
                 </div>
                 Insights Automáticos
               </CardTitle>
            </CardHeader>
            <CardContent>
               {m.insights.length === 0 ? (
                 <p className="text-sm text-muted-foreground">O sistema está aprendendo. Mais dados necessários para insights.</p>
               ) : (
                 <ul className="space-y-3">
                   {m.insights.map((insight, i) => (
                     <li key={i} className="flex gap-2 text-sm">
                       <span className="text-primary font-bold">•</span>
                       <span>{insight}</span>
                     </li>
                   ))}
                 </ul>
               )}
            </CardContent>
         </Card>
      </div>

      {/* Bloco 5 - Smart Insights por Horário */}
      {m.smart_insights && m.smart_insights.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" /> Padrões de Faltas por Horário
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {m.smart_insights.map((insight, i) => {
              const severityStyles = {
                info: {
                  card: 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20',
                  icon: 'text-blue-600 dark:text-blue-400',
                  title: 'text-blue-700 dark:text-blue-300',
                  badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                },
                warning: {
                  card: 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20',
                  icon: 'text-amber-600 dark:text-amber-400',
                  title: 'text-amber-700 dark:text-amber-300',
                  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                },
                critical: {
                  card: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20',
                  icon: 'text-red-600 dark:text-red-400',
                  title: 'text-red-700 dark:text-red-300',
                  badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }
              }
              const style = severityStyles[insight.severity] || severityStyles.info
              const typeLabels: Record<string, string> = {
                'patient_time': 'Paciente',
                'professional_day': 'Profissional',
                'best_time': 'Melhor Horário',
                'worst_time': 'Atenção',
                'worst_day': 'Dia Crítico'
              }

              return (
                <Card key={i} className={style.card}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${style.badge}`}>
                        {typeLabels[insight.type] || insight.type}
                      </span>
                      {insight.severity === 'critical' && (
                        <AlertCircle className={`h-4 w-4 ${style.icon}`} />
                      )}
                      {insight.severity === 'warning' && (
                        <AlertCircle className={`h-4 w-4 ${style.icon}`} />
                      )}
                      {insight.severity === 'info' && (
                        <CheckCircle2 className={`h-4 w-4 ${style.icon}`} />
                      )}
                    </div>
                    <CardTitle className={`text-sm font-semibold mt-2 ${style.title}`}>
                      {insight.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      {insight.description}
                    </p>
                    <div className="flex items-start gap-2 text-xs bg-background/50 rounded p-2">
                      <TrendingUp className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{insight.action_hint}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
             </div>
             </div>
           )
         }
         