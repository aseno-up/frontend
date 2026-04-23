import type { Metadata } from 'next'
import { SpecialtyTemplate, SpecialtyData } from '../specialty-template'

export const metadata: Metadata = {
  title: 'Software para Clínicas | Gestão de Clínica | Aseno',
  description: 'Agenda para clínica com confirmação automática no WhatsApp, controle de atendimentos recorrentes e gestão completa do dia a dia. O Aseno é o software de gestão feito para clínicas.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

const data: SpecialtyData = {
  badge: 'Software de gestão para clínicas com atendimentos recorrentes',
  heroTitle: 'Seus clientes somem no meio do atendimento.',
  heroTitleAccent: 'O Aseno impede isso.',
  heroSub: 'Mantém clientes no fluxo da agenda, reduz faltas e dá controle real da operação da clínica — sem planilha ou WhatsApp manual.',
  heroNote: 'Sem cartão de crédito. Você configura em menos de um dia.',
  problemTitle: 'O faturamento vem com continuidade. Mas o cliente some.',
  problems: [
    { title: 'Cliente abandona o atendimento', description: 'Chega motivado, faz os primeiros atendimentos e para de aparecer. Sem aviso. Você só descobre quando o horário fica vago.' },
    { title: 'Histórico de atendimento espalhado', description: 'O que foi feito no atendimento anterior, quais serviços foram realizados — vira um exercício de memória quando a ficha está em papel ou espalhada.' },
    { title: 'Confirmação manual o dia inteiro', description: 'Recepcionista no WhatsApp um a um, pergunta se o cliente vem, espera resposta, anota. Isso custa tempo que poderia estar na operação da clínica.' },
  ],
  solutionTitle: 'Tudo que sua clínica precisa para gerenciar o dia a dia.',
  solutionSub: 'Pensado para clínicas que trabalham com atendimentos recorrentes e agenda cheia.',
  features: [
    { title: 'Sessões recorrentes com plano de atendimento', description: 'Cadastre o pacote de sessões e agende os atendimentos de forma sequencial. Não precisa remarcar um a um toda semana.' },
    { title: 'Ficha e histórico do cliente', description: 'Cada cliente tem ficha com histórico completo de atendimentos. Registre observações e anotações — acessível por qualquer dispositivo.' },
    { title: 'Confirmação automática via WhatsApp', description: 'Lembretes 48h, 24h e 2h antes de cada sessão. Cliente confirma ou cancela e o sistema atualiza a agenda em tempo real.' },
    { title: 'Detector de risco de faltas', description: 'Identifica clientes com padrão de ausência ou baixa frequência e sinaliza antes que abandonem a agenda.' },
    { title: 'Controle de acesso por perfil', description: 'Cada profissional de saúde acessa apenas sua agenda e seus clientes. Você mantém visão geral sem abrir informação para toda a equipe.' },
    { title: 'Atendimento remoto via Google Meet', description: 'Para sessões online ou orientação a distância: gere o link de Google Meet direto pelo Aseno, sem sair do sistema.' },
  ],
  reasonsTitle: '3 motivos para usar o Aseno na sua clínica.',
  reasons: [
    { title: 'Atendimentos que chegam ao fim', description: 'Pacotes de sessão organizados e alertas de risco de abandono para manter o cliente no fluxo.' },
    { title: 'Histórico de atendimento acessível', description: 'Ficha completa por cliente, com observações registradas em cada atendimento — sem papel, sem retrabalho.' },
    { title: 'Agenda que se confirma sozinha', description: 'Lembretes automáticos por WhatsApp eliminam a confirmação manual e liberam tempo da equipe.' },
  ],
  whatsapp: {
    clinicName: 'Clínica Exemplo',
    messageIn: 'Olá Carlos! Lembrete: seu atendimento é amanhã às 08h (sessão 5 de 12). Confirma sua presença?',
    messageOut: 'Confirmo! Estarei aí amanhã.',
    messageReply: 'Sua presença está confirmada. Até amanhã!',
  },
  testimonials: [
    { text: 'Desde que implementamos, nossas faltas caíram drasticamente. A confirmação automática pelo WhatsApp é incrível — não precisamos mais ligar para cada cliente.', author: 'Clínica FisioVida', role: 'Gestão de Clínica' },
    { text: 'O controle do pacote de sessões mudou tudo. Antes eu perdia cliente no meio do serviço. Agora vejo quem está em risco de abandonar.', author: 'Instituto Postura', role: 'Gestão de Clínica' },
    { text: 'Ter o histórico de atendimento acessível em qualquer dispositivo economiza tempo entre um cliente e outro. Não preciso mais procurar fichas em papel.', author: 'Clínica Movimento & Saúde', role: 'Gestão de Clínica' },
  ],
  faqs: [
    { question: 'O Aseno funciona para profissional autônomo, sem clínica?', answer: 'Sim. O plano Básico atende até 3 profissionais e é usado tanto por clínicas pequenas quanto por profissionais independentes.' },
    { question: 'Preciso migrar todos os dados do meu sistema atual?', answer: 'Não necessariamente. Você pode começar do zero. Se quiser importar sua base, isso está disponível no plano Avançado com suporte.' },
    { question: 'O WhatsApp automático pode ser banido?', answer: 'No plano Profissional, o Aseno usa o WhatsApp Oficial (API oficial da Meta), o que elimina o risco de banimento.' },
    { question: 'Preciso instalar algo?', answer: 'Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.' },
    { question: 'Funciona no celular?', answer: 'Sim. Interface totalmente responsiva em qualquer smartphone, tablet ou computador.' },
    { question: 'Preciso de cartão para testar?', answer: 'Não. 14 dias com acesso completo, sem cartão de crédito.' },
  ],
}

export default async function ClinicasLandingPage(props: PageProps) {
  const params = await props.params
  return <SpecialtyTemplate lng={params.lng} data={data} />
}
