"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Config, Driver, DriveStep } from "driver.js"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"

import { api } from "@/lib/api/client"
import { useAuthStore } from "@/stores/auth-store"

// Tutorial version — bump to re-show the tour to everyone after a major rewrite.
const TUTORIAL_VERSION = "2.0"
const CACHE_PREFIX = "aseno_tutorial"

// Pages where the tour auto-starts on first visit. Picked because they are the
// most common entry points for new users and tend to confuse first-time users
// (especially receptionists) if presented cold.
const AUTO_START_PAGES: TutorialPage[] = [
  "agenda",
  "planos-sessao",
  "whatsapp",
  "dashboard",
]

// Interactive tours drive a real form and need form validation suspended so
// the demo can advance without the user filling anything. Page-level code
// (e.g. planos-sessao/page.tsx handleNext) checks `window.__asenoTourActive`.
const INTERACTIVE_TOURS = new Set<TutorialPage>([
  "planos-sessao-individual",
  "planos-sessao-grupo",
])

declare global {
  interface Window {
    __asenoTourActive?: boolean
  }
}

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
  | "planos-sessao-individual"
  | "planos-sessao-grupo"
  | "procedimentos"
  | "financeiro"

interface UseTutorialOptions {
  page?: TutorialPage
  /** Defaults to true — hook decides internally using the whitelist above. */
  autoStart?: boolean
  lng?: string
}

// A step definition, where `onNextClick`/`onPrevClick` can reach the live driver
// instance via the `getDriver()` closure so interactive tours can advance only
// after a simulated click or DOM change settles.
type Tour = DriveStep[] | ((getDriver: () => Driver | null) => DriveStep[])

// Click a [data-tutorial="..."] element safely (missing selector is a no-op
// because the tour may be mid-build when a previous step expects it).
function clickTutorialTarget(selector: string) {
  const el = document.querySelector<HTMLElement>(`[data-tutorial="${selector}"]`)
  el?.click()
}

// Advance after the DOM settles — dialog mounting and React state updates need
// roughly a tick. 350ms is enough for the wizard dialog to finish its transition.
function advanceAfter(driver: Driver | undefined, delayMs = 350) {
  if (!driver) return
  setTimeout(() => driver.moveNext(), delayMs)
}

// driver.js internally calls `.focus()` on the highlighted element and
// `.scrollIntoView()` to bring it into view (see node_modules/driver.js source
// lines 53-60, 302). Both trigger native browser scrolling of the *document*
// root — which in our dashboard is <html>/<body>, not the real <main> scroll
// container. The result: the page appears to grow because the browser scrolls
// past what the flex layout actually rendered, exposing blank space.
//
// Fix: during a tour, wrap focus() to use {preventScroll:true} and wrap
// scrollIntoView() to scroll the nearest scrollable ancestor (usually <main>)
// instead of letting the browser pick the document root. Restored on destroy.
function installScrollGuards(): () => void {
  const origFocus = HTMLElement.prototype.focus
  const origScrollIntoView = Element.prototype.scrollIntoView
  const origWindowScrollTo = window.scrollTo.bind(window)
  const origWindowScrollBy = window.scrollBy.bind(window)

  // Freeze current document scroll position — driver.js (and any other code
  // running during the tour) can't move <html>/<body> out from under the flex
  // layout. The real scroll container is <main>, and our scrollIntoView hook
  // below still moves that when needed.
  const frozenX = window.scrollX
  const frozenY = window.scrollY

  HTMLElement.prototype.focus = function (opts?: FocusOptions) {
    return origFocus.call(this, { ...(opts || {}), preventScroll: true })
  }

  Element.prototype.scrollIntoView = function (
    this: Element,
    arg?: boolean | ScrollIntoViewOptions,
  ) {
    // Popovers are positioned relative to the viewport (fixed) — they don't
    // need scrolling. Only scroll the real content container.
    if ((this as HTMLElement).classList?.contains("driver-popover")) return
    const container = findScrollableAncestor(this as HTMLElement)
    if (!container) return
    const elRect = this.getBoundingClientRect()
    const contRect = container.getBoundingClientRect()
    const current = container.scrollTop
    const delta = elRect.top - contRect.top - (contRect.height - elRect.height) / 2
    container.scrollTop = current + delta
    void arg
  }

  window.scrollTo = ((..._args: unknown[]) => {
    // Restore frozen position instead of applying the requested scroll —
    // anything trying to scroll <html>/<body> during the tour is fighting the
    // flex layout and will make the page "grow".
    origWindowScrollTo(frozenX, frozenY)
  }) as typeof window.scrollTo
  window.scrollBy = ((..._args: unknown[]) => {
    origWindowScrollTo(frozenX, frozenY)
  }) as typeof window.scrollBy

  return () => {
    HTMLElement.prototype.focus = origFocus
    Element.prototype.scrollIntoView = origScrollIntoView
    window.scrollTo = origWindowScrollTo
    window.scrollBy = origWindowScrollBy
  }
}

// Walk up looking for the nearest element whose content overflows and is
// scrollable. Skips <body>/<html> so scroll stays inside the dashboard <main>.
function findScrollableAncestor(el: HTMLElement): HTMLElement | null {
  let parent: HTMLElement | null = el.parentElement
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = getComputedStyle(parent)
    const overflowY = style.overflowY
    const scrollable =
      (overflowY === "auto" || overflowY === "scroll") &&
      parent.scrollHeight > parent.clientHeight
    if (scrollable) return parent
    parent = parent.parentElement
  }
  return null
}

// Builds an interactive "create plan" tour. Steps simulate clicks on the wizard
// controls so the user watches the UI reacting — matches the flow they'll need
// to reproduce themselves.
function buildCreatePlanTour(type: "individual" | "group"): DriveStep[] {
  const isIndividual = type === "individual"
  const kindLabel = isIndividual ? "Plano Individual" : "Turma / Grupo"

  return [
    {
      popover: {
        title: `Criar um ${kindLabel}`,
        description: isIndividual
          ? "Vou abrir o formulário e passar por cada campo com você. Basta ir clicando em Próximo — eu vou mostrando o que cada parte faz."
          : "Vou abrir o formulário e guiar passo a passo a criação de uma turma (grupo com vários pacientes no mesmo horário). Clique em Próximo para começar.",
      },
    },
    {
      element: '[data-tutorial="new-plan"]',
      popover: {
        title: "Abrir o formulário",
        description:
          "Este é o botão que cria um plano novo. Vou abrir o formulário automaticamente agora.",
        side: "left",
        align: "center",
        onNextClick: (_el, _step, { driver }) => {
          clickTutorialTarget("new-plan")
          advanceAfter(driver, 400)
        },
      },
    },
    {
      element: '[data-tutorial="wizard-type"]',
      popover: {
        title: "Escolha o tipo",
        description: isIndividual
          ? "Individual é uma sequência de sessões para um único paciente. Vou selecionar para você."
          : "Turma é um horário fixo com vários pacientes ao mesmo tempo. Vou selecionar para você.",
        side: "bottom",
        align: "center",
        onNextClick: (_el, _step, { driver }) => {
          const radioId = isIndividual ? "type-individual" : "type-group"
          document.getElementById(radioId)?.click()
          advanceAfter(driver, 250)
        },
      },
    },
    isIndividual
      ? {
          element: '[data-tutorial="wizard-patient"]',
          popover: {
            title: "Escolher o paciente",
            description:
              "Digite o nome ou procure na lista. Só aparecem pacientes ativos da sua clínica.",
            side: "bottom",
            align: "start",
          },
        }
      : {
          element: '[data-tutorial="wizard-capacity"]',
          popover: {
            title: "Capacidade da turma",
            description:
              "Quantos pacientes cabem ao mesmo tempo. Você matricula os pacientes depois que a turma existe — é onde escolhe em quais dias da semana cada um participa.",
            side: "bottom",
            align: "start",
          },
        },
    {
      element: '[data-tutorial="wizard-next"]',
      popover: {
        title: "Avançar para o pacote",
        description:
          "Agora vamos definir nome, quantidade de sessões e frequência. Vou avançar.",
        side: "top",
        align: "end",
        onNextClick: (_el, _step, { driver }) => {
          clickTutorialTarget("wizard-next")
          advanceAfter(driver, 300)
        },
      },
    },
    {
      element: '[data-tutorial="wizard-title"]',
      popover: {
        title: "Nome do pacote",
        description:
          "Aparece na agenda e nos lembretes. Se você escolher um procedimento abaixo, o nome é preenchido automaticamente.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tutorial="wizard-sessions-frequency"]',
      popover: {
        title: "Sessões e frequência",
        description:
          "Quantas sessões o pacote tem (ou marque 'Indeterminado' para contínuo) e com que frequência. Escolhendo 2x, 3x ou personalizado, um seletor de dias da semana aparece abaixo.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="wizard-procedure"]',
      popover: {
        title: "Procedimento",
        description:
          "Ligar o plano a um procedimento cadastrado traz valor e duração automaticamente. Se não quiser, pode digitar à mão.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="wizard-next"]',
      popover: {
        title: "Ir para profissional",
        description: "Vou avançar para escolher quem atende essas sessões.",
        side: "top",
        align: "end",
        onNextClick: (_el, _step, { driver }) => {
          clickTutorialTarget("wizard-next")
          advanceAfter(driver, 300)
        },
      },
    },
    {
      element: '[data-tutorial="wizard-professional-mode"]',
      popover: {
        title: "Profissional fixo ou flexível",
        description:
          "Fixo: todas as sessões ficam com um profissional específico. Flexível: cada sessão pode ser atribuída depois, direto pela agenda. Útil quando vários profissionais se revezam.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="wizard-next"]',
      popover: {
        title: "Ir para pagamento",
        description: "Última etapa: como vai ser cobrado.",
        side: "top",
        align: "end",
        onNextClick: (_el, _step, { driver }) => {
          clickTutorialTarget("wizard-next")
          advanceAfter(driver, 300)
        },
      },
    },
    {
      element: '[data-tutorial="wizard-payment-mode"]',
      popover: {
        title: "Modo de pagamento",
        description: isIndividual
          ? "Por sessão cobra a cada atendimento. À vista cobra tudo no início. Mensalidade parcela em valor fixo por mês."
          : "Na turma, o modo é apenas a sugestão padrão: cada aluno paga no momento da matrícula — não agora.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tutorial="wizard-submit"]',
      popover: {
        title: "Criar o plano",
        description:
          "Este botão finaliza. O tour não vai clicar por você — preencha os campos que faltarem e clique quando estiver pronto. Pronto para criar seu primeiro!",
        side: "top",
        align: "end",
      },
    },
  ]
}

// Tutorial steps for each page
const tutorialSteps: Record<TutorialPage, Tour> = {
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
        description:
          "Aqui ficam todos os agendamentos da clínica. Vou mostrar como navegar entre datas, alternar visualizações, filtrar por profissional e criar agendamentos de duas formas diferentes.",
      },
    },
    {
      element: ".fc-prev-button",
      popover: {
        title: "Voltar e avançar",
        description:
          "As setas movem a agenda para o período anterior ou seguinte (um dia, uma semana ou um mês, conforme a visão escolhida).",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: ".fc-today-button",
      popover: {
        title: "Voltar para hoje",
        description:
          "Quando você estiver navegando longe, este botão traz a agenda de volta para a data de hoje com um clique.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: ".fc-timeGridWeek-button",
      popover: {
        title: "Alternar visualização",
        description:
          "Mês dá visão geral. Semana mostra grade horária (ideal para rotina). Dia é o detalhado — sessões hora a hora. Lista é compacta para celular.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: '[data-tutorial="professional-filter"]',
      popover: {
        title: "Filtrar por profissional",
        description:
          "Com vários profissionais na clínica, selecione um para ver só os horários dele. Deixe em branco (limpando com o X) para ver todos sobrepostos.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tutorial="new-appointment"]',
      popover: {
        title: "Criar agendamento rápido",
        description:
          "Abre o formulário do zero: paciente, profissional, procedimento e horário — tudo num só lugar.",
        side: "left",
        align: "center",
      },
    },
    {
      popover: {
        title: "Criar direto no calendário",
        description:
          "Outra forma: clique em um espaço vazio do calendário (ou arraste para definir um intervalo). O formulário de novo agendamento já abre com data e hora preenchidas. Para reagendar, basta arrastar um evento existente para outro horário.",
      },
    },
    {
      popover: {
        title: "Detalhes de um agendamento",
        description:
          "Clicar num evento abre os detalhes: paciente, status de confirmação por WhatsApp, pagamento, observações. De lá você também confirma presença, cancela ou remarca.",
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
        title: "WhatsApp da clínica",
        description:
          "Conectar o WhatsApp permite que o sistema envie confirmações, lembretes e receba respostas dos pacientes automaticamente. Vou explicar como conectar e o que cada opção significa.",
      },
    },
    {
      element: '[data-tutorial="whatsapp-status"]',
      popover: {
        title: "Status da conexão",
        description:
          "Este banner mostra se o WhatsApp está conectado ou não. Quando conectado, aparece verde e indica o método usado (QR Code ou Oficial). Desconectado fica âmbar e nenhum lembrete é enviado até você reconectar.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="whatsapp-method-official"]',
      popover: {
        title: "Método 1 — WhatsApp Oficial (recomendado)",
        description:
          "Número dedicado via Meta Business. Precisa de aprovação da Meta e de um número novo, mas é estável: sem risco de banimento e funciona 24/7. Ideal para clínicas com volume alto de mensagens.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tutorial="whatsapp-method-qr"]',
      popover: {
        title: "Método 2 — QR Code (mais rápido)",
        description:
          "Usa seu WhatsApp normal — o mesmo do celular. Conecta em segundos escaneando um código. Funciona para começar rápido, mas o celular precisa estar ligado e com internet, e a Meta pode desconectar se detectar volume alto.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: '[data-tutorial="whatsapp-generate-qr"]',
      popover: {
        title: "Gerar o QR Code",
        description:
          "Se escolher o método QR Code, este botão gera a imagem a ser escaneada. O código expira em alguns minutos — se não conectar a tempo, peça um novo.",
        side: "top",
        align: "center",
      },
    },
    {
      popover: {
        title: "Como escanear o QR Code",
        description: `Com o QR Code na tela, siga estes passos no celular:
          <ol style="margin:10px 0 0 20px;padding:0;line-height:1.6;">
            <li>Abra o <strong>WhatsApp</strong> no celular</li>
            <li>Toque em <strong>Mais opções</strong> (⋮ no Android) ou <strong>Ajustes</strong> (iPhone)</li>
            <li>Toque em <strong>Dispositivos conectados</strong></li>
            <li>Toque em <strong>Conectar um dispositivo</strong></li>
            <li>Aponte a câmera para o QR Code na tela</li>
          </ol>
          <p style="margin-top:10px;font-size:0.8125rem;opacity:0.8;">Pronto — em segundos o status vira verde e os envios automáticos começam.</p>`,
      },
    },
    {
      popover: {
        title: "Se o QR Code expirar",
        description:
          "Se demorar para escanear, o QR vira cinza e mostra 'Atualizar código'. É só clicar para gerar um novo — é rápido e seguro.",
      },
    },
    {
      popover: {
        title: "Próximos passos",
        description:
          "Depois de conectado, abra a aba <strong>Configurações</strong> aqui mesmo para ajustar: quando os lembretes são enviados (ex: 24h antes), o texto das mensagens e se deseja receber respostas. Toda confirmação que o paciente responder aparece automaticamente na agenda.",
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
        title: "Planos de sessão",
        description:
          "Planos e turmas permitem agendar um tratamento recorrente de uma só vez. Você define a frequência, os dias da semana e o sistema cria todos os agendamentos automaticamente.",
      },
    },
    {
      element: '[data-tutorial="plan-search"]',
      popover: {
        title: "Buscar e filtrar",
        description: "Encontre planos por nome do paciente, título da turma ou profissional responsável.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tutorial="plan-status-filter"]',
      popover: {
        title: "Filtro de status",
        description: "Alterne entre planos ativos, pausados, concluídos ou cancelados.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tutorial="new-plan"]',
      popover: {
        title: "Criar plano ou turma",
        description:
          "Abre um passo-a-passo para criar um plano individual (um paciente) ou uma turma (vários pacientes no mesmo horário). Você escolhe tudo: paciente, profissional, procedimento, frequência e valor.",
        side: "left",
        align: "center",
      },
    },
    {
      popover: {
        title: "A tabela de planos",
        description:
          "Cada linha é um plano. Progresso mostra sessões realizadas vs total (planos sem fim aparecem como 'contínuo'). À direita ficam os atalhos: Pausar interrompe novos agendamentos, Retomar volta a gerar sessões e Cancelar encerra — pagamentos pendentes continuam sendo cobrados.",
      },
    },
    {
      popover: {
        title: "Detalhes do plano",
        description:
          "Ao clicar numa linha você abre o detalhe, onde consegue: matricular pacientes em turmas (escolhendo os dias da semana de cada um), registrar presença por sessão e ver/configurar pagamentos (por sessão, à vista ou mensal).",
      },
    },
    {
      popover: {
        title: "Quer ver como criar um plano?",
        description: `<p style="margin:0 0 12px 0;">Posso abrir o formulário e guiar você campo a campo. Escolha o tipo:</p>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button type="button" class="aseno-tour-cta" data-plan-tour="individual">Plano individual (1 paciente)</button>
            <button type="button" class="aseno-tour-cta" data-plan-tour="group">Turma / Grupo (vários pacientes)</button>
          </div>`,
      },
    },
  ],
  // Interactive: opens the wizard, picks "Individual" and walks through each field.
  // Callbacks simulate clicks so users see the real UI reacting step by step.
  "planos-sessao-individual": () => buildCreatePlanTour("individual"),

  // Interactive: same idea but for group/class plans.
  "planos-sessao-grupo": () => buildCreatePlanTour("group"),

  procedimentos: [
    {
      popover: {
        title: "Procedimentos",
        description: "Gerencie os procedimentos disponíveis para agendamentos na sua clínica.",
      },
    }
  ],
  financeiro: [
    {
      popover: {
        title: "Financeiro",
        description: "Acompanhe metricas financeiras, relatorios e desempenho da sua clinica.",
      },
    }
  ],
}

// Cache key is scoped by user so multiple people sharing a browser don't see
// each other's "already completed" state. The backend is the source of truth;
// localStorage is only used to avoid the first-paint flash.
function cacheKeyFor(userId: string | undefined): string | null {
  if (!userId) return null
  return `${CACHE_PREFIX}:${userId}`
}

function readCache(userId: string | undefined): Set<TutorialPage> {
  if (typeof window === "undefined") return new Set()
  const key = cacheKeyFor(userId)
  if (!key) return new Set()

  try {
    const stored = localStorage.getItem(key)
    const version = localStorage.getItem(`${key}:version`)

    if (version !== TUTORIAL_VERSION) {
      localStorage.removeItem(key)
      localStorage.removeItem(`${key}:version`)
      return new Set()
    }

    if (stored) {
      return new Set(JSON.parse(stored) as TutorialPage[])
    }
  } catch {
    // Corrupted cache — fall through to empty set.
  }

  return new Set()
}

function writeCache(userId: string | undefined, completed: Set<TutorialPage>) {
  if (typeof window === "undefined") return
  const key = cacheKeyFor(userId)
  if (!key) return
  localStorage.setItem(key, JSON.stringify([...completed]))
  localStorage.setItem(`${key}:version`, TUTORIAL_VERSION)
}

function clearCache(userId: string | undefined) {
  if (typeof window === "undefined") return
  const key = cacheKeyFor(userId)
  if (!key) return
  localStorage.removeItem(key)
  localStorage.removeItem(`${key}:version`)
}

export function useTutorial(options: UseTutorialOptions = {}) {
  const { page = "global", autoStart } = options
  const userId = useAuthStore((s) => s.user?.id)
  const driverRef = useRef<Driver | null>(null)
  const guardCleanupRef = useRef<(() => void) | null>(null)
  const shouldAutoStart =
    autoStart !== undefined ? autoStart : AUTO_START_PAGES.includes(page)

  const [completedTutorials, setCompletedTutorials] = useState<Set<TutorialPage>>(new Set())
  const [isRunning, setIsRunning] = useState(false)

  // Hydrate from local cache immediately, then reconcile with backend.
  useEffect(() => {
    setCompletedTutorials(readCache(userId))

    if (!userId) return
    let cancelled = false
    api
      .getCompletedTutorials()
      .then((resp) => {
        if (cancelled) return
        const remote = new Set((resp.pages ?? []) as TutorialPage[])
        setCompletedTutorials(remote)
        writeCache(userId, remote)
      })
      .catch(() => {
        // Offline or transient error — keep local cache; next mount retries.
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const isCompleted = completedTutorials.has(page)

  const markCompleted = useCallback(
    (tutorialPage: TutorialPage) => {
      setCompletedTutorials((prev) => {
        if (prev.has(tutorialPage)) return prev
        const updated = new Set(prev)
        updated.add(tutorialPage)
        writeCache(userId, updated)
        return updated
      })
      if (userId) {
        api.markTutorialCompleted(tutorialPage).catch(() => {
          // Non-blocking — local cache already reflects completion.
        })
      }
    },
    [userId],
  )

  const resetTutorial = useCallback(
    (tutorialPage?: TutorialPage) => {
      if (tutorialPage) {
        setCompletedTutorials((prev) => {
          const updated = new Set(prev)
          updated.delete(tutorialPage)
          writeCache(userId, updated)
          return updated
        })
        // Backend has no per-page reset: resetting a single page locally lets
        // the user re-watch it while other pages stay marked. Next backend
        // fetch will re-add the page unless the user also calls full reset.
        return
      }
      setCompletedTutorials(new Set())
      clearCache(userId)
      if (userId) {
        api.resetTutorials().catch(() => {
          // Ignore — local state already reset.
        })
      }
    },
    [userId],
  )

  const startTutorial = useCallback(
    (customPage?: TutorialPage) => {
      const targetPage = customPage || page
      const tour = tutorialSteps[targetPage]
      if (!tour) return

      // Late-bind driverObj so step callbacks can call moveNext() after the
      // DOM settles (e.g. after opening a dialog).
      const getDriver = () => driverRef.current
      const steps = typeof tour === "function" ? tour(getDriver) : tour
      if (!steps || steps.length === 0) return

      setIsRunning(true)

      // Remove any previous guards (e.g. when switching from the basic tour
      // to an interactive one without the driver lifecycle cleanup running).
      guardCleanupRef.current?.()
      guardCleanupRef.current = installScrollGuards()

      const isInteractive = INTERACTIVE_TOURS.has(targetPage)
      if (isInteractive) {
        window.__asenoTourActive = true
      }

      const config: Config = {
        showProgress: true,
        showButtons: ["next", "previous", "close"],
        nextBtnText: "Próximo",
        prevBtnText: "Anterior",
        doneBtnText: "Concluir",
        progressText: "{{current}} de {{total}}",
        popoverClass: "aseno-tutorial-popover",
        // Overlay is an SVG — these are the only knobs that actually work.
        overlayColor: "#0f172a",
        overlayOpacity: 0.55,
        stagePadding: 6,
        stageRadius: 12,
        smoothScroll: false,
        allowClose: true,
        disableActiveInteraction: false,
        steps,
        onDestroyStarted: () => {
          setIsRunning(false)
          markCompleted(targetPage)
          driverRef.current?.destroy()
          driverRef.current = null
          guardCleanupRef.current?.()
          guardCleanupRef.current = null
          window.__asenoTourActive = false
        },
      }

      const driverObj = driver(config)
      driverRef.current = driverObj
      driverObj.drive()
    },
    [page, markCompleted],
  )

  // Auto-start tutorial on this page for users who haven't seen it yet.
  useEffect(() => {
    if (!shouldAutoStart || isCompleted || isRunning || !userId) return
    const timer = setTimeout(() => startTutorial(), 600)
    return () => clearTimeout(timer)
  }, [shouldAutoStart, isCompleted, isRunning, page, userId, startTutorial])

  // Event delegation for the "start interactive plan tour" CTAs that appear
  // inside the last popover of the basic planos-sessao tour. Avoids polluting
  // window globals and cleans itself up when the hook unmounts.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-plan-tour]",
      )
      if (!target) return
      const kind = target.getAttribute("data-plan-tour")
      if (kind !== "individual" && kind !== "group") return
      e.preventDefault()
      driverRef.current?.destroy()
      driverRef.current = null
      guardCleanupRef.current?.()
      guardCleanupRef.current = null
      window.__asenoTourActive = false
      // Tick so the old popover finishes cleanup before the new one mounts.
      setTimeout(
        () =>
          startTutorial(
            kind === "individual" ? "planos-sessao-individual" : "planos-sessao-grupo",
          ),
        150,
      )
    }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [startTutorial])

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
