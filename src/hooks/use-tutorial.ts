"use client"

import { useCallback, useEffect, useState } from "react"
import { driver, DriveStep } from "driver.js"
import "driver.js/dist/driver.css"

const TUTORIAL_COMPLETED_KEY = "aseno_tutorial_completed"
const TUTORIAL_VERSION = "1.0" // Increment this to show tutorial again after updates

interface UseTutorialOptions {
  autoStart?: boolean
  lng?: string
}

// Tutorial steps for the main dashboard
const getDashboardSteps = (lng: string): DriveStep[] => [
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
    element: '[data-tutorial="agenda"]',
    popover: {
      title: "Agenda",
      description: "Gerencie todos os agendamentos da sua clinica. Visualize por dia, semana ou mes.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="pacientes"]',
    popover: {
      title: "Pacientes",
      description: "Cadastre e gerencie seus pacientes. Acesse historico de atendimentos e fichas.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="profissionais"]',
    popover: {
      title: "Profissionais",
      description: "Cadastre os profissionais da clinica e configure suas agendas individuais.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="whatsapp"]',
    popover: {
      title: "WhatsApp",
      description: "Conecte seu WhatsApp para enviar confirmacoes e lembretes automaticos aos pacientes.",
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
      description: "Clique aqui a qualquer momento para rever este tutorial.",
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
]

// Onboarding checklist steps
const getOnboardingSteps = (lng: string): DriveStep[] => [
  {
    popover: {
      title: "Bem-vindo ao Aseno!",
      description: "Vamos configurar sua clinica em poucos passos. Este guia vai te ajudar a comecar.",
    },
  },
  {
    element: '[data-tutorial="profissionais"]',
    popover: {
      title: "Passo 1: Cadastre Profissionais",
      description: "Comece cadastrando os profissionais que atenderao na clinica.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="pacientes"]',
    popover: {
      title: "Passo 2: Cadastre Pacientes",
      description: "Adicione seus pacientes para poder agendar consultas.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="whatsapp"]',
    popover: {
      title: "Passo 3: Conecte o WhatsApp",
      description: "Conecte seu WhatsApp para ativar confirmacoes automaticas.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="agenda"]',
    popover: {
      title: "Passo 4: Crie Agendamentos",
      description: "Pronto! Agora voce pode criar seus primeiros agendamentos.",
      side: "right",
      align: "start",
    },
  },
  {
    popover: {
      title: "Tudo Pronto!",
      description: "Sua clinica esta configurada. Clique no botao de tutorial (?) a qualquer momento para rever este guia.",
    },
  },
]

export function useTutorial(options: UseTutorialOptions = {}) {
  const { autoStart = false, lng = "pt-BR" } = options
  const [isCompleted, setIsCompleted] = useState(true)
  const [isRunning, setIsRunning] = useState(false)

  // Check if tutorial was completed
  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem(TUTORIAL_COMPLETED_KEY)
      const completedVersion = localStorage.getItem(`${TUTORIAL_COMPLETED_KEY}_version`)

      if (completed === "true" && completedVersion === TUTORIAL_VERSION) {
        setIsCompleted(true)
      } else {
        setIsCompleted(false)
      }
    }
  }, [])

  // Auto-start tutorial for new users
  useEffect(() => {
    if (autoStart && !isCompleted && !isRunning) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startOnboarding()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [autoStart, isCompleted, isRunning])

  const markCompleted = useCallback(() => {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, "true")
    localStorage.setItem(`${TUTORIAL_COMPLETED_KEY}_version`, TUTORIAL_VERSION)
    setIsCompleted(true)
  }, [])

  const resetTutorial = useCallback(() => {
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY)
    localStorage.removeItem(`${TUTORIAL_COMPLETED_KEY}_version`)
    setIsCompleted(false)
  }, [])

  const startTutorial = useCallback(() => {
    setIsRunning(true)

    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      nextBtnText: "Proximo",
      prevBtnText: "Anterior",
      doneBtnText: "Concluir",
      progressText: "{{current}} de {{total}}",
      popoverClass: "aseno-tutorial-popover",
      steps: getDashboardSteps(lng),
      onDestroyStarted: () => {
        setIsRunning(false)
        markCompleted()
        driverObj.destroy()
      },
    })

    driverObj.drive()
  }, [lng, markCompleted])

  const startOnboarding = useCallback(() => {
    setIsRunning(true)

    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      nextBtnText: "Proximo",
      prevBtnText: "Anterior",
      doneBtnText: "Comecar!",
      progressText: "{{current}} de {{total}}",
      popoverClass: "aseno-tutorial-popover",
      steps: getOnboardingSteps(lng),
      onDestroyStarted: () => {
        setIsRunning(false)
        markCompleted()
        driverObj.destroy()
      },
    })

    driverObj.drive()
  }, [lng, markCompleted])

  return {
    isCompleted,
    isRunning,
    startTutorial,
    startOnboarding,
    resetTutorial,
    markCompleted,
  }
}
