import type { Metadata } from 'next'
import { SpecialtyTemplate, SpecialtyData } from '../specialty-template'

export const metadata: Metadata = {
  title: 'Confirmação de Consulta por WhatsApp | Aseno',
  description: 'Confirme consultas automaticamente pelo WhatsApp. Reduza faltas em até 50% sem ligar para cada paciente. Teste grátis por 14 dias.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

const data: SpecialtyData = {
  badge: 'Confirmação automática de consultas',
  heroTitle: 'Pare de ligar para confirmar consulta.',
  heroTitleAccent: 'O WhatsApp faz isso por você.',
  heroSub: 'O Aseno envia lembretes automáticos pelo WhatsApp, entende a resposta do paciente e atualiza sua agenda sozinho — sem sua equipe tocar no telefone.',
  heroNote: 'Sem cartão de crédito. Você configura em menos de um dia.',
  problemTitle: 'Confirmar consulta no manual não escala.',
  problems: [
    { title: 'Sua equipe perde horas ligando', description: 'Ligar para cada paciente um dia antes consome tempo da recepcionista que deveria estar atendendo quem está na clínica. Com 15, 20 consultas por dia, é inviável.' },
    { title: 'Paciente não atende e falta', description: 'Você liga, não atende. Manda mensagem, não responde. No dia, a cadeira fica vazia. O horário se perdeu — e a receita também.' },
    { title: 'Agenda com buracos que ninguém preenche', description: 'Quando o paciente avisa que não vai em cima da hora, não dá tempo de encaixar ninguém. O horário vira prejuízo.' },
  ],
  solutionTitle: 'Confirmação automática que funciona de verdade.',
  solutionSub: 'O Aseno cuida de toda a comunicação com o paciente antes da consulta.',
  features: [
    { title: '3 lembretes automáticos pelo WhatsApp', description: 'O sistema envia lembretes 48h, 24h e 2h antes de cada consulta. O paciente recebe no WhatsApp — onde ele realmente vê e responde.' },
    { title: 'IA que entende a resposta do paciente', description: 'O paciente responde "vou sim", "não consigo ir" ou "posso trocar pra quinta?" — e a IA entende e atualiza o status automaticamente.' },
    { title: 'WhatsApp Oficial — sem risco de ban', description: 'No plano Profissional, as mensagens são enviadas pela API oficial da Meta. Sem risco de bloqueio.' },
    { title: 'Lista de espera automática', description: 'Paciente cancelou? O sistema avisa quem está na lista de espera. O horário se preenche sozinho.' },
    { title: 'Detector de risco de faltas', description: 'Identifica pacientes com histórico de ausência e te avisa antes. Você age preventivamente.' },
    { title: 'Relatórios de prejuízo por faltas', description: 'Veja quanto dinheiro sua clínica está perdendo com faltas e cancelamentos. Dados reais para decisões melhores.' },
  ],
  reasonsTitle: '3 motivos para automatizar suas confirmações.',
  reasons: [
    { title: 'Sua equipe para de ligar', description: 'Lembretes automáticos no WhatsApp substituem as ligações manuais. Sua recepcionista foca no atendimento.' },
    { title: 'Menos faltas, mais receita', description: 'Pacientes confirmados aparecem. Quem não pode ir avisa a tempo, e o horário vai pra lista de espera.' },
    { title: 'WhatsApp sem risco', description: 'API oficial da Meta. Sem banimento, sem número pessoal exposto, sem surpresas.' },
  ],
  whatsapp: {
    clinicName: 'Sua Clínica',
    messageIn: 'Olá Ana! Lembrete: sua consulta é amanhã às 14h. Confirma sua presença?',
    messageOut: 'Confirmo! Vou estar lá no horário',
    messageReply: 'Perfeito! Sua presença está confirmada. Até amanhã!',
  },
  testimonials: [
    { text: 'Nossas faltas caíram pela metade no primeiro mês. A confirmação automática pelo WhatsApp é o que mais fez diferença.', author: 'Clínica Vitalitá', role: 'Estética e Dermatologia' },
    { text: 'Nossa recepcionista economiza horas por dia. O Aseno faz o trabalho pesado de confirmar e reagendar sozinho.', author: 'Clínica Bem Estar', role: 'Fisioterapia' },
    { text: 'A lista de espera automática é fantástica. Quando um paciente cancela, o sistema preenche a vaga rápido.', author: 'Instituto Mente Sã', role: 'Psicologia' },
  ],
  faqs: [
    { question: 'Como funciona a confirmação automática pelo WhatsApp?', answer: 'O Aseno envia lembretes 48h, 24h e 2h antes de cada consulta. O paciente responde direto no WhatsApp e o sistema atualiza o status. No plano Profissional, a IA entende respostas em linguagem natural.' },
    { question: 'Preciso trocar meu número de WhatsApp?', answer: 'Não. No plano Profissional, você conecta um número dedicado com WhatsApp Oficial (API da Meta). Seu número pessoal fica separado.' },
    { question: 'E se o paciente não responder a confirmação?', answer: 'O paciente recebe até 3 lembretes. Se não responder, o status fica como "pendente" e o Detector de Risco de Faltas te avisa.' },
    { question: 'Funciona para qualquer especialidade?', answer: 'Sim. Estética, fisioterapia, psicologia, pilates, nutrição, massoterapia e qualquer área que agende consultas.' },
    { question: 'Preciso instalar algo?', answer: 'Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.' },
    { question: 'Preciso de cartão para testar?', answer: 'Não. 14 dias com acesso completo, sem cartão de crédito.' },
  ],
}

export default async function ConfirmacaoWhatsAppLandingPage(props: PageProps) {
  const params = await props.params
  return <SpecialtyTemplate lng={params.lng} data={data} />
}
