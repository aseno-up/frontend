'use client'

import { useState, useEffect } from 'react'
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
  AlertCircle
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/client'

// Mock data based on dashboard.md requirements
// In a real implementation, this would come from an API endpoint like /api/dashboard/metrics
const mockMetrics = {
  // Block 1 - Operational/Financial
  estimatedRevenue: 12500,
  completedConsultations: 45,
  confirmedConsultations: 28,
  noShows: 3,
  attendanceRate: 94,

  // Block 2 - Agenda & Occupancy
  agendaOccupancy: 78,
  openSlotsThisWeek: 12,
  futureSessions: 142,

  // Block 3 - Automation Impact
  avoidedNoShows: 5,
  autoConfirmed: 24,
  preservedRevenue: 1250
}

interface DashboardPageProps {
  params: Promise<{ lng: string }>
}

export default function DashboardPage(props: DashboardPageProps) {
  const [lng, setLng] = useState('pt-BR')
  
  // Unwrap params
  useEffect(() => {
    props.params.then(p => setLng(p.lng))
  }, [props.params])

  const { t } = useTranslation(lng, 'dashboard')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-8">
      <Header lng={lng} title="Visão Geral" />

      {/* Bloco 1 - Visão Rápida */}
      <div>
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
              <div className="text-2xl font-bold">{formatCurrency(mockMetrics.estimatedRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Baseado em agendamentos do mês
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Comparecimento
              </CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {mockMetrics.completedConsultations} realizadas / {mockMetrics.noShows} faltas
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
              <div className="text-2xl font-bold">{mockMetrics.confirmedConsultations}</div>
              <p className="text-xs text-muted-foreground">
                Agendadas para os próximos dias
              </p>
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
              <div className="text-2xl font-bold">{mockMetrics.noShows}</div>
              <p className="text-xs text-muted-foreground">
                Neste mês
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
              <div className="text-2xl font-bold">{mockMetrics.agendaOccupancy}%</div>
              <div className="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full" 
                  style={{ width: `${mockMetrics.agendaOccupancy}%` }}
                />
              </div>
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
              <div className="text-2xl font-bold">{mockMetrics.openSlotsThisWeek}</div>
              <p className="text-xs text-muted-foreground">
                Disponíveis nesta semana
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
              <div className="text-2xl font-bold">{mockMetrics.futureSessions}</div>
              <p className="text-xs text-muted-foreground">
                Total agendado
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                Confirmadas Automaticamente
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{mockMetrics.autoConfirmed}</div>
              <p className="text-xs text-green-600/80 dark:text-green-400/80">
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
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{mockMetrics.avoidedNoShows}</div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                Lembretes recuperados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">
                Receita Preservada
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(mockMetrics.preservedRevenue)}</div>
              <p className="text-xs text-primary/80">
                Graças à automação
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
