'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/dashboard/header'
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
  Filter,
  Zap,
  CreditCard,
  Wallet,
  PiggyBank,
  BarChart3,
  Lightbulb,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/client'
import { api } from '@/lib/api/client'
import { DashboardMetrics } from '@/types/api'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { handleApiError } from '@/lib/toast'
import { OnboardingButton } from '@/components/onboarding/onboarding-button'
import { useAuthStore } from '@/stores/auth-store'

interface DashboardPageProps {
  params: Promise<{ lng: string }>
}

type DateRange = 'current_month' | 'last_month' | 'last_30_days' | 'last_60_days'

interface MarketplaceBalance {
  balance: number
  totalPending: number
  totalReceived: number
}

interface MarketplaceSummary {
  total_received: number
  total_pending: number
  total_fees: number
  net_received: number
  payments_by_method: Record<string, number>
  payment_count: number
}

export default function DashboardPage(props: DashboardPageProps) {
  const [lng, setLng] = useState('pt-BR')
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('current_month')
  const [hasSubaccount, setHasSubaccount] = useState(false)
  const [marketplaceBalance, setMarketplaceBalance] = useState<MarketplaceBalance | null>(null)
  const [marketplaceSummary, setMarketplaceSummary] = useState<MarketplaceSummary | null>(null)
  const [marketplaceLoading, setMarketplaceLoading] = useState(false)

  const clinic = useAuthStore((s) => s.clinic)

  useEffect(() => {
    props.params.then((p) => setLng(p.lng))
  }, [props.params])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation(lng, 'dashboard')

  // Check subaccount once on mount
  useEffect(() => {
    if (!clinic?.id) return
    api
      .checkMarketplaceSubaccount(clinic.id)
      .then((res) => setHasSubaccount(res.has_subaccount))
      .catch(() => setHasSubaccount(false))
  }, [clinic?.id])

  const getDateRange = useCallback(() => {
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

    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    }
  }, [dateRange])

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      const { start, end } = getDateRange()
      const data = await api.getDashboardMetrics(start, end)
      setMetrics(data)
    } catch (err) {
      handleApiError(err, 'Erro ao carregar dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [getDateRange])

  const fetchMarketplaceData = useCallback(async () => {
    if (!hasSubaccount) return
    try {
      setMarketplaceLoading(true)
      const { start, end } = getDateRange()
      const [balance, summary] = await Promise.all([
        api.getMarketplaceBalance(),
        api.getMarketplaceSummary({ date_from: start, date_to: end }),
      ])
      setMarketplaceBalance(balance)
      setMarketplaceSummary(summary)
    } catch (err) {
      handleApiError(err, 'Erro ao carregar dados financeiros')
    } finally {
      setMarketplaceLoading(false)
    }
  }, [hasSubaccount, getDateRange])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    fetchMarketplaceData()
  }, [fetchMarketplaceData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatCurrencyParts = (value: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
    const parts = formatted.split(',')
    return { integer: parts[0], decimal: parts[1] || '00' }
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
    smart_insights: [],
  }

  const valuePerSlot = m.open_slots > 0 ? m.potential_revenue / m.open_slots : 0
  const pendingSessions = m.future_sessions - m.confirmed_consultations
  const onlineReceived = marketplaceSummary?.total_received ?? 0
  const totalRevenue = Math.round((m.estimated_revenue + onlineReceived) * 100) / 100
  const revenueParts = formatCurrencyParts(totalRevenue)

  const methodLabels: Record<string, string> = {
    PIX: 'PIX',
    CREDIT_CARD: 'Cartão de Crédito',
    BOLETO: 'Boleto',
    DEBIT_CARD: 'Cartão de Débito',
    UNDEFINED: 'Outros',
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

        {/* ═══════════ 1. HERO STRIP ═══════════ */}
        <div
          className="relative overflow-hidden rounded-2xl bg-slate-900 p-8"
          data-tutorial="stats-cards"
        >
          {/* Glow effect */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_120%_at_80%_50%,rgba(14,165,160,0.09),transparent)]" />
          <div className="pointer-events-none absolute -top-10 right-32 h-48 w-48 rounded-full bg-teal-500 opacity-[0.06] blur-[60px]" />

          <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto]">
            {/* Left - main revenue */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-400">
                Faturamento Total
              </p>
              <div className="mb-3 font-mono text-5xl font-medium leading-none tracking-tight text-white">
                <span className="text-teal-400">R$</span>{' '}
                {revenueParts.integer}
                <span className="text-2xl text-slate-500">,{revenueParts.decimal}</span>
              </div>
              <p className="text-sm text-slate-400">
                {hasSubaccount && onlineReceived > 0
                  ? `Registrado nas consultas (${formatCurrency(m.estimated_revenue)}) + recebido online (${formatCurrency(onlineReceived)})`
                  : "Baseado em consultas realizadas e confirmadas"
                }
              </p>
            </div>

            {/* Right - quick stats */}
            <div className="flex items-center gap-6">
              <div className="text-right" data-tutorial="attendance-rate">
                <div className="text-2xl font-bold leading-none text-emerald-400">
                  {m.attendance_rate.toFixed(1)}%
                </div>
                <div className="mt-1 text-xs text-slate-500">Comparecimento</div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-right">
                <div className="text-2xl font-bold leading-none text-white">
                  {m.confirmed_consultations}
                </div>
                <div className="mt-1 text-xs text-slate-500">Confirmadas</div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-right">
                <div className="text-2xl font-bold leading-none text-amber-400">
                  {m.no_shows}
                </div>
                <div className="mt-1 text-xs text-slate-500">Faltas</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ 2. FINANCEIRO (only if has_subaccount) ═══════════ */}
        {hasSubaccount && (
          <div>
            {/* Section header */}
            <div className="mb-4 mt-2 flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Wallet className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Financeiro
              </h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {marketplaceLoading && !marketplaceSummary ? (
              <div className="flex items-center justify-center h-32">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
              </div>
            ) : (
              <>
                {/* Row 1: Main financial cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
                  {/* Recebido Online */}
                  <div className="group relative overflow-hidden rounded-xl border border-slate-200 border-t-[3px] border-t-teal-500 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Recebido Online</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-500">
                        <DollarSign className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="font-mono text-2xl font-bold tracking-tight text-teal-600">
                      {formatCurrency(marketplaceSummary?.total_received ?? 0)}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {marketplaceSummary?.payment_count ?? 0} pagamentos no período
                    </p>
                  </div>

                  {/* Faturamento Registrado */}
                  <div className="group relative overflow-hidden rounded-xl border border-slate-200 border-t-[3px] border-t-blue-500 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Faturamento Registrado</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="font-mono text-2xl font-bold tracking-tight text-blue-600">
                      {formatCurrency(m.estimated_revenue)}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Baseado em pagamentos registrados nas consultas
                    </p>
                  </div>

                  {/* Saldo Disponível */}
                  <div className="group relative overflow-hidden rounded-xl border border-slate-200 border-t-[3px] border-t-emerald-500 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Saldo Disponível</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                        <PiggyBank className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="font-mono text-2xl font-bold tracking-tight text-emerald-600">
                      {formatCurrency(marketplaceBalance?.balance ?? 0)}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Disponível para saque
                    </p>
                  </div>
                </div>

                {/* Row 2: Pending + Payment Methods */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Pagamentos Pendentes */}
                  <div className="group relative overflow-hidden rounded-xl border border-slate-200 border-t-[3px] border-t-amber-500 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Pagamentos Pendentes</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="font-mono text-2xl font-bold tracking-tight text-amber-600">
                      {formatCurrency(marketplaceSummary?.total_pending ?? 0)}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Aguardando confirmação de pagamento
                    </p>
                  </div>

                  {/* Por Método */}
                  <div className="group relative overflow-hidden rounded-xl border border-slate-200 border-t-[3px] border-t-violet-500 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Por Método de Pagamento</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                        <CreditCard className="h-4 w-4" />
                      </div>
                    </div>
                    {marketplaceSummary?.payments_by_method &&
                    Object.keys(marketplaceSummary.payments_by_method).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(marketplaceSummary.payments_by_method).map(
                          ([method, value]) => (
                            <div key={method} className="flex items-center justify-between">
                              <span className="text-sm text-slate-600">
                                {methodLabels[method] || method}
                              </span>
                              <span className="font-mono text-sm font-semibold text-slate-700">
                                {formatCurrency(value)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Nenhum pagamento no período</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════ 3. AGENDA & OCUPAÇÃO ═══════════ */}
        <div>
          {/* Section header */}
          <div className="mb-4 mt-2 flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <CalendarCheck className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Agenda & Ocupação
            </h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid gap-4 md:grid-cols-[1.8fr_1fr_1fr]">
            {/* Ocupação da Agenda - main card */}
            <div className="group rounded-xl border border-slate-200 border-t-[3px] border-t-teal-500 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">Ocupação da agenda</p>
                  <div className="text-5xl font-bold tracking-tighter text-slate-900">
                    {m.agenda_occupancy.toFixed(1)}
                    <span className="text-xl font-semibold text-slate-400">%</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <TrendingUp className="h-3 w-3" />
                  {(100 - m.agenda_occupancy).toFixed(1)}% vazia
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="mb-1.5 flex justify-between text-[11px] text-slate-400">
                  <span>0%</span>
                  <span>Ocupação atual</span>
                  <span>100%</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-700"
                    style={{ width: `${Math.min(m.agenda_occupancy, 100)}%` }}
                  />
                </div>
              </div>

              {/* Opportunity banner */}
              {m.potential_revenue > 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/50 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-lg">
                    <Lightbulb className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="block font-mono text-base font-bold text-amber-800">
                      {formatCurrency(m.potential_revenue)}
                    </span>
                    <span className="text-xs text-amber-700/75">
                      potencial em {m.open_slots} horários vagos não preenchidos
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Horários Vagos */}
            <div className="group flex flex-col rounded-xl border border-slate-200 border-t-[3px] border-t-amber-500 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Horários vagos</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-amber-500">{m.open_slots}</div>
              <p className="mt-1 text-xs text-slate-400">Slots disponíveis no período</p>
              {valuePerSlot > 0 && (
                <div className="mt-auto pt-3">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <div className="text-[10px] font-semibold text-amber-700">Valor por slot</div>
                    <div className="font-mono text-base font-medium text-amber-800">
                      {formatCurrency(valuePerSlot)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sessões Futuras */}
            <div className="group flex flex-col rounded-xl border border-slate-200 border-t-[3px] border-t-blue-500 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Sessões futuras</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                  <CalendarCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">{m.future_sessions}</div>
              <p className="mt-1 text-xs text-slate-400">Total agendado adiante</p>
              <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  {m.confirmed_consultations} confirmadas
                </span>
                {pendingSessions > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    {pendingSessions} pendentes
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ 4. IMPACTO DA AUTOMAÇÃO ═══════════ */}
        <div>
          {/* Section header */}
          <div className="mb-4 mt-2 flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Impacto da Automação · WhatsApp
            </h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Auto-confirmadas */}
            <div className="group relative overflow-hidden rounded-xl border border-teal-200 border-t-[3px] border-t-teal-500 bg-teal-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="mb-2 text-xs font-semibold tracking-wide text-teal-700">
                Confirmadas automaticamente
              </div>
              <div className="text-3xl font-bold text-slate-900">{m.auto_confirmed}</div>
              <p className="mt-1 text-xs text-teal-600">Sem intervenção humana</p>
              <CheckCircle2 className="absolute bottom-3 right-3.5 h-10 w-10 text-teal-500 opacity-10" />
            </div>

            {/* Faltas evitadas */}
            <div className="group relative overflow-hidden rounded-xl border border-blue-200 border-t-[3px] border-t-blue-500 bg-blue-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="mb-2 text-xs font-semibold tracking-wide text-blue-700">
                Faltas evitadas
              </div>
              <div className="text-3xl font-bold text-slate-900">{m.avoided_no_shows}</div>
              <p className="mt-1 text-xs text-blue-600">Lembretes recuperados (est.)</p>
              <Clock className="absolute bottom-3 right-3.5 h-10 w-10 text-blue-500 opacity-10" />
            </div>

            {/* Receita preservada */}
            <div className="group relative overflow-hidden rounded-xl border border-blue-200 border-t-[3px] border-t-blue-500 bg-blue-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg" data-tutorial="revenue-card">
              <div className="mb-2 text-xs font-semibold tracking-wide text-blue-700">
                Receita preservada
              </div>
              <div className="font-mono text-2xl font-bold text-slate-900">
                {formatCurrency(m.preserved_revenue)}
              </div>
              <p className="mt-1 text-xs text-blue-600">Sem automação, seriam perdidas</p>
              <DollarSign className="absolute bottom-3 right-3.5 h-10 w-10 text-blue-500 opacity-10" />
            </div>

            {/* Projeção anual */}
            <div className="group relative overflow-hidden rounded-xl border border-teal-200 border-t-[3px] border-t-teal-500 bg-teal-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="mb-2 text-xs font-semibold tracking-wide text-teal-700">
                Projeção anual
              </div>
              <div className="font-mono text-2xl font-bold text-slate-900">
                {formatCurrency(m.annual_savings_projection)}
              </div>
              <p className="mt-1 text-xs text-teal-600">Economia estimada se manter taxa</p>
              <TrendingUp className="absolute bottom-3 right-3.5 h-10 w-10 text-teal-500 opacity-10" />
            </div>
          </div>
        </div>

        {/* ═══════════ 5. ANÁLISE & PADRÕES ═══════════ */}
        <div>
          {/* Section header */}
          <div className="mb-4 mt-2 flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <AlertCircle className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Análise & Padrões
            </h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Ranking de Faltas */}
            <div className="group rounded-xl border border-slate-200 border-t-[3px] border-t-red-500 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
              <h3 className="text-sm font-semibold text-slate-900">Ranking de faltas</h3>
              <p className="mb-4 text-xs text-slate-400">Pacientes que mais faltam no período</p>

              {!m.top_absentees || m.top_absentees.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2.5 py-7">
                  <div className="flex h-13 w-13 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <span className="block text-sm font-semibold text-slate-700">
                      Nenhuma falta neste período
                    </span>
                    <span className="text-xs text-slate-400">
                      Taxa de comparecimento perfeita
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {m.top_absentees.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{p.name}</span>
                      </div>
                      <span className="text-sm font-bold text-red-600">{p.absent_count} faltas</span>
                    </div>
                  ))}
                  <p className="pt-1 text-xs text-slate-400">
                    {m.top_absentees.length} pacientes concentram a maioria das faltas.
                  </p>
                </div>
              )}
            </div>

            {/* Insights Automáticos - dark card */}
            <div className="relative overflow-hidden rounded-xl bg-slate-900 p-6">
              <div className="pointer-events-none absolute -bottom-8 -right-5 h-28 w-28 rounded-full bg-teal-500 opacity-[0.07]" />

              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                  <Zap className="h-3.5 w-3.5 text-teal-400" />
                </div>
                <span className="text-xs font-semibold text-white/60">Insights automáticos</span>
              </div>

              {m.insights.length === 0 ? (
                <p className="text-sm text-white/40">
                  O sistema está aprendendo. Mais dados necessários para insights.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {m.insights.map((insight, i) => (
                    <div
                      key={i}
                      className="flex gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5"
                    >
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <p className="text-xs leading-relaxed text-white/65">{insight}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Smart Insights / Padrões por Horário */}
            <div className="group rounded-xl border border-slate-200 border-t-[3px] border-t-slate-400 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
              <h3 className="text-sm font-semibold text-slate-900">Padrões de faltas</h3>
              <p className="mb-4 text-xs text-slate-400">Distribuição por horário</p>

              {m.smart_insights && m.smart_insights.length > 0 ? (
                <div className="space-y-2.5">
                  {m.smart_insights.slice(0, 4).map((insight, i) => {
                    const severityColor: Record<string, { tag: string; val: string }> = {
                      info: { tag: 'text-blue-500', val: 'text-teal-600' },
                      warning: { tag: 'text-amber-500', val: 'text-amber-600' },
                      critical: { tag: 'text-red-500', val: 'text-red-600' },
                    }
                    const colors = severityColor[insight.severity] || severityColor.info

                    const typeLabels: Record<string, string> = {
                      patient_time: 'Paciente',
                      professional_day: 'Profissional',
                      best_time: 'Melhor Horário',
                      worst_time: 'Atenção',
                      worst_day: 'Dia Crítico',
                    }

                    return (
                      <div
                        key={i}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3"
                      >
                        <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${colors.tag}`}>
                          {insight.type === 'best_time' ? '\u2713 ' : ''}
                          {typeLabels[insight.type] || insight.type}
                        </div>
                        <div className={`text-sm font-semibold ${colors.val}`}>
                          {insight.title}
                        </div>
                        <div className="text-xs text-slate-400">{insight.description}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 opacity-50">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Sem dados
                    </div>
                    <div className="text-sm font-semibold text-slate-600">
                      Dados insuficientes
                    </div>
                    <div className="text-xs text-slate-400">
                      Mais consultas são necessárias para identificar padrões
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Extended Smart Insights (full cards, only if more than 4) */}
        {m.smart_insights && m.smart_insights.length > 4 && (
          <div>
            <div className="mb-4 mt-2 flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Padrões de Faltas por Horário
              </h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {m.smart_insights.slice(4).map((insight, i) => {
                const severityStyles = {
                  info: {
                    card: 'border-blue-200 bg-blue-50/50',
                    icon: 'text-blue-600',
                    title: 'text-blue-700',
                    badge: 'bg-blue-100 text-blue-700',
                  },
                  warning: {
                    card: 'border-amber-200 bg-amber-50/50',
                    icon: 'text-amber-600',
                    title: 'text-amber-700',
                    badge: 'bg-amber-100 text-amber-700',
                  },
                  critical: {
                    card: 'border-red-200 bg-red-50/50',
                    icon: 'text-red-600',
                    title: 'text-red-700',
                    badge: 'bg-red-100 text-red-700',
                  },
                }
                const style = severityStyles[insight.severity] || severityStyles.info

                const typeLabels: Record<string, string> = {
                  patient_time: 'Paciente',
                  professional_day: 'Profissional',
                  best_time: 'Melhor Horário',
                  worst_time: 'Atenção',
                  worst_day: 'Dia Crítico',
                }

                return (
                  <div
                    key={i}
                    className={`group rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${style.card}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${style.badge}`}>
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
                    <h4 className={`mb-1 text-sm font-semibold ${style.title}`}>{insight.title}</h4>
                    <p className="mb-3 text-sm text-slate-500">{insight.description}</p>
                    <div className="flex items-start gap-2 rounded bg-white/50 p-2 text-xs text-slate-500">
                      <TrendingUp className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>{insight.action_hint}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
