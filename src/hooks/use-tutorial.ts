"use client"

import { useCallback, useEffect, useState } from "react"
import { driver, DriveStep } from "driver.js"
import "driver.js/dist/driver.css"

const TUTORIAL_COMPLETED_KEY = "aseno_tutorial"
const TUTORIAL_VERSION = "1.0"

export type TutorialPage =
  | "global"
  | "dashboard"
  | "agenda"
  | "pacientes"
  | "profissionais"
  | "whatsapp"
  | "faturamento"
  | "configuracoes"
  | "planos-sessao"

interface UseTutorialOptions {
  page?: TutorialPage
  autoStart?: boolean
  lng?: string
}

// Tutorial steps for each page
const tutorialSteps: Record<TutorialPage, DriveStep[]> = {
  global: [
    {
      element: '[data-tutorial="sidebar"]',
      popover: {
        title: "Menu de Navegacao",
        description: "Aqui voce encontra todas as secoes do sistema: agenda, pacientes, profissionais, WhatsApp e mais.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tutorial="search"]',
      popover: {
        title: "Busca Rapida",
        description: "Encontre pacientes, agendamentos ou profissionais rapidamente.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="tutorial-button"]',
      popover: {
        title: "Tutorial",
        description: "Clique aqui a qualquer momento para ver o tutorial da pagina atual.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="notifications"]',
      popover: {
        title: "Notificacoes",
        description: "Acompanhe novos agendamentos, confirmacoes e alertas importantes.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="user-menu"]',
      popover: {
        title: "Seu Perfil",
        description: "Acesse configuracoes da conta e da clinica, ou faca logout.",
        side: "bottom",
        align: "end",
      },
    },
  ],

  dashboard: [
    {
      popover: {
        title: "Visao Geral",
        description: "Este e o painel principal da sua clinica. Aqui voce ve um resumo de tudo que esta acontecendo.",
      },
    },
    {
      element: '[data-tutorial="stats-cards"]',
      popover: {
        title: "Metricas do Dia",
        description: "Acompanhe agendamentos, confirmacoes, faltas e faturamento estimado do dia.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="attendance-rate"]',
      popover: {
        title: "Taxa de Comparecimento",
        description: "Veja a porcentagem de pacientes que comparecem as consultas. Quanto maior, melhor!",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="revenue-card"]',
      popover: {
        title: "Faturamento",
        description: "Acompanhe o faturamento estimado e quanto voce deixou de perder com o sistema de confirmacoes.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="upcoming-appointments"]',
      popover: {
        title: "Proximos Agendamentos",
        description: "Lista dos proximos pacientes do dia com status de confirmacao.",
        side: "left",
        align: "start",
      },
    },
    {
      element: '[data-tutorial="recent-activity"]',
      popover: {
        title: "Atividade Recente",
        description: "Veja as ultimas acoes: confirmacoes, cancelamentos e novos agendamentos.",
        side: "left",
        align: "start",
      },
    },
  ],

  agenda: [
    {
      popover: {
        title: "Agenda",
        description: "Gerencie todos os agendamentos da sua clinica de forma visual e intuitiva.",
      },
    },
    {
      element: '[data-tutorial="calendar-view"]',
      popover: {
        title: "Calendario",
        description: "Visualize os agendamentos por dia, semana ou mes. Clique e arraste para criar novos.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="calendar-navigation"]',
      popover: {
        title: "Navegacao",
        description: "Use as setas para navegar entre os dias/semanas. Clique em 'Hoje' para voltar ao dia atual.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="view-toggle"]',
      popover: {
        title: "Tipo de Visualizacao",
        description: "Alterne entre visualizacao por dia, semana ou mes conforme sua preferencia.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="professional-filter"]',
      popover: {
        title: "Filtro por Profissional",
        description: "Filtre a agenda para ver apenas os horarios de um profissional especifico.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="new-appointment"]',
      popover: {
        title: "Novo Agendamento",
        description: "Clique aqui para criar um novo agendamento rapidamente.",
        side: "left",
        align: "center",
      },
    },
  ],

  pacientes: [
    {
      popover: {
        title: "Pacientes",
        description: "Gerencie todos os pacientes da sua clinica. Cadastre novos e acesse historicos.",
      },
    },
    {
      element: '[data-tutorial="patient-search"]',
      popover: {
        title: "Buscar Paciente",
        description: "Pesquise por nome, telefone ou email para encontrar um paciente rapidamente.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tutorial="new-patient"]',
      popover: {
        title: "Novo Paciente",
        description: "Clique aqui para cadastrar um novo paciente.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="patient-list"]',
      popover: {
        title: "Lista de Pacientes",
        description: "Veja todos os pacientes cadastrados. Clique em um para ver detalhes e historico.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="patient-risk"]',
      popover: {
        title: "Risco de Falta",
        description: "O sistema calcula automaticamente o risco de falta baseado no historico do paciente.",
        side: "left",
        align: "center",
      },
    },
  ],

  profissionais: [
    {
      popover: {
        title: "Profissionais",
        description: "Cadastre e gerencie os profissionais que atendem na sua clinica.",
      },
    },
    {
      element: '[data-tutorial="new-professional"]',
      popover: {
        title: "Novo Profissional",
        description: "Adicione um novo profissional com especialidade, horarios e cor na agenda.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="professional-list"]',
      popover: {
        title: "Lista de Profissionais",
        description: "Veja todos os profissionais. Clique para editar horarios de atendimento.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="professional-schedule"]',
      popover: {
        title: "Horarios de Atendimento",
        description: "Configure os dias e horarios que cada profissional atende.",
        side: "left",
        align: "center",
      },
    },
  ],

  whatsapp: [
    {
      popover: {
        title: "WhatsApp",
        description: "Conecte seu WhatsApp para enviar confirmacoes e lembretes automaticos.",
      },
    },
    {
      element: '[data-tutorial="whatsapp-status"]',
      popover: {
        title: "Status da Conexao",
        description: "Veja se o WhatsApp esta conectado e funcionando corretamente.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="whatsapp-qr"]',
      popover: {
        title: "Conectar WhatsApp",
        description: "Escaneie o QR Code com seu celular para conectar o WhatsApp da clinica.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="whatsapp-messages"]',
      popover: {
        title: "Mensagens Enviadas",
        description: "Acompanhe todas as mensagens enviadas e seus status de entrega.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="whatsapp-templates"]',
      popover: {
        title: "Modelos de Mensagem",
        description: "Personalize as mensagens de confirmacao e lembrete enviadas aos pacientes.",
        side: "left",
        align: "center",
      },
    },
  ],

  faturamento: [
    {
      popover: {
        title: "Faturamento",
        description: "Acompanhe o faturamento da clinica e veja relatorios financeiros.",
      },
    },
    {
      element: '[data-tutorial="billing-summary"]',
      popover: {
        title: "Resumo Financeiro",
        description: "Veja o faturamento total, recebido e pendente do periodo.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="billing-chart"]',
      popover: {
        title: "Grafico de Faturamento",
        description: "Visualize a evolucao do faturamento ao longo do tempo.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="billing-filter"]',
      popover: {
        title: "Filtros",
        description: "Filtre por periodo, profissional ou status de pagamento.",
        side: "bottom",
        align: "center",
      },
    },
  ],

  configuracoes: [
    {
      popover: {
        title: "Configuracoes",
        description: "Personalize o sistema de acordo com as necessidades da sua clinica.",
      },
    },
    {
      element: '[data-tutorial="clinic-settings"]',
      popover: {
        title: "Dados da Clinica",
        description: "Atualize nome, endereco, telefone e outras informacoes da clinica.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tutorial="notification-settings"]',
      popover: {
        title: "Notificacoes",
        description: "Configure quando e como os lembretes sao enviados aos pacientes.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tutorial="calendar-integration"]',
      popover: {
        title: "Google Calendar",
        description: "Conecte com o Google Calendar para sincronizar seus agendamentos.",
        side: "right",
        align: "start",
      },
    },
  ],

  "planos-sessao": [
    {
      popover: {
        title: "Planos de Sessao",
        description: "Crie pacotes de sessoes para tratamentos continuos e acompanhe o progresso.",
      },
    },
    {
      element: '[data-tutorial="new-plan"]',
      popover: {
        title: "Novo Plano",
        description: "Crie um plano de sessoes definindo quantidade, valor e frequencia.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="plan-list"]',
      popover: {
        title: "Planos Ativos",
        description: "Veja todos os planos em andamento e quantas sessoes restam.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="plan-progress"]',
      popover: {
        title: "Progresso",
        description: "Acompanhe o progresso de cada plano: sessoes realizadas vs total.",
        side: "left",
        align: "center",
      },
    },
  ],
}

// Get completed tutorials from localStorage
function getCompletedTutorials(): Set<TutorialPage> {
  if (typeof window === "undefined") return new Set()

  try {
    const stored = localStorage.getItem(TUTORIAL_COMPLETED_KEY)
    const version = localStorage.getItem(`${TUTORIAL_COMPLETED_KEY}_version`)

    if (version !== TUTORIAL_VERSION) {
      localStorage.removeItem(TUTORIAL_COMPLETED_KEY)
      return new Set()
    }

    if (stored) {
      return new Set(JSON.parse(stored))
    }
  } catch {
    // Ignore errors
  }

  return new Set()
}

// Save completed tutorials to localStorage
function saveCompletedTutorials(completed: Set<TutorialPage>) {
  if (typeof window === "undefined") return

  localStorage.setItem(TUTORIAL_COMPLETED_KEY, JSON.stringify([...completed]))
  localStorage.setItem(`${TUTORIAL_COMPLETED_KEY}_version`, TUTORIAL_VERSION)
}

export function useTutorial(options: UseTutorialOptions = {}) {
  const { page = "global", autoStart = false, lng = "pt-BR" } = options
  const [completedTutorials, setCompletedTutorials] = useState<Set<TutorialPage>>(new Set())
  const [isRunning, setIsRunning] = useState(false)

  // Load completed tutorials on mount
  useEffect(() => {
    setCompletedTutorials(getCompletedTutorials())
  }, [])

  const isCompleted = completedTutorials.has(page)

  // Auto-start tutorial for new users on this page
  useEffect(() => {
    if (autoStart && !isCompleted && !isRunning && completedTutorials.size > 0) {
      const timer = setTimeout(() => {
        startTutorial()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [autoStart, isCompleted, isRunning, page])

  const markCompleted = useCallback((tutorialPage: TutorialPage) => {
    setCompletedTutorials(prev => {
      const updated = new Set(prev)
      updated.add(tutorialPage)
      saveCompletedTutorials(updated)
      return updated
    })
  }, [])

  const resetTutorial = useCallback((tutorialPage?: TutorialPage) => {
    if (tutorialPage) {
      setCompletedTutorials(prev => {
        const updated = new Set(prev)
        updated.delete(tutorialPage)
        saveCompletedTutorials(updated)
        return updated
      })
    } else {
      // Reset all tutorials
      setCompletedTutorials(new Set())
      localStorage.removeItem(TUTORIAL_COMPLETED_KEY)
      localStorage.removeItem(`${TUTORIAL_COMPLETED_KEY}_version`)
    }
  }, [])

  const startTutorial = useCallback((customPage?: TutorialPage) => {
    const targetPage = customPage || page
    const steps = tutorialSteps[targetPage]

    if (!steps || steps.length === 0) return

    setIsRunning(true)

    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      nextBtnText: "Proximo",
      prevBtnText: "Anterior",
      doneBtnText: "Concluir",
      progressText: "{{current}} de {{total}}",
      popoverClass: "aseno-tutorial-popover",
      steps,
      onDestroyStarted: () => {
        setIsRunning(false)
        markCompleted(targetPage)
        driverObj.destroy()
      },
    })

    driverObj.drive()
  }, [page, markCompleted])

  // Start onboarding (global tutorial for first-time users)
  const startOnboarding = useCallback(() => {
    startTutorial("global")
  }, [startTutorial])

  return {
    isCompleted,
    isRunning,
    completedTutorials,
    startTutorial,
    startOnboarding,
    resetTutorial,
    markCompleted,
  }
}

// Export tutorial steps for reference
export { tutorialSteps }
export type { DriveStep }
