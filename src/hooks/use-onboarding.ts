import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api/client'

export interface OnboardingStatus {
  clinic_info_complete: boolean
  professionals_count: number
  has_schedule_configured: boolean
  whatsapp_connected: boolean
  google_connected: boolean
  appointments_count: number
  progress: number
  next_step: string
  is_complete: boolean
}

export interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
  href: string
  icon: string
}

export function useOnboarding() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await api.getOnboardingStatus()
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch onboarding status'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const steps: OnboardingStep[] = [
    {
      id: 'clinic_info',
      title: 'Dados da Clinica',
      description: 'Nome, telefone e email',
      completed: status?.clinic_info_complete ?? false,
      href: '/configuracoes',
      icon: 'Building2',
    },
    {
      id: 'professionals',
      title: 'Profissionais',
      description: 'Crie ao menos um profissional',
      completed: (status?.professionals_count ?? 0) > 0,
      href: '/profissionais',
      icon: 'Users',
    },
    {
      id: 'schedule',
      title: 'Horarios de Atendimento',
      description: 'Configure os horarios de trabalho',
      completed: status?.has_schedule_configured ?? false,
      href: '/profissionais',
      icon: 'Clock',
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      description: 'Conecte para lembretes automaticos',
      completed: status?.whatsapp_connected ?? false,
      href: '/whatsapp',
      icon: 'MessageSquare',
    },
    {
      id: 'first_appointment',
      title: 'Primeiro Agendamento',
      description: 'Crie um agendamento de teste',
      completed: (status?.appointments_count ?? 0) > 0,
      href: '/agenda',
      icon: 'CalendarCheck',
    },
  ]

  return {
    status,
    steps,
    isLoading,
    error,
    refetch: fetchStatus,
    progress: status?.progress ?? 0,
    isComplete: status?.is_complete ?? false,
    nextStep: status?.next_step,
  }
}
