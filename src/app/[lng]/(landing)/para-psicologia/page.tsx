import type { Metadata } from 'next'
import { SpecialtyTemplate, SpecialtyData } from '../specialty-template'

export const metadata: Metadata = {
  title: 'Software para Psicólogos e Clínicas de Psicologia | Aseno',
  description: 'Gerencie sua agenda, reduza faltas e receba online sem usar seu WhatsApp pessoal. O Aseno foi feito para psicólogos que trabalham com sessões recorrentes.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

const data: SpecialtyData = {
  badge: 'Para psicólogos com sessões recorrentes',
  heroTitle: 'Sua agenda organizada. Suas sessões confirmadas.',
  heroTitleAccent: 'Sem depender do seu WhatsApp pessoal.',
  heroSub: 'O Aseno cuida da confirmação, do histórico e do pagamento para que você possa focar no atendimento.',
  heroNote: 'Sem cartão de crédito. Configuração em menos de uma hora.',
  problemTitle: 'Você reservou o horário. O paciente não apareceu.',
  problems: [
    { title: 'Faltas sem aviso prévio', description: 'O paciente não aparece e você fica com 50 minutos vazios, sem reposição e sem conseguir encaixar outro atendimento.' },
    { title: 'Cobrança pelo WhatsApp pessoal', description: 'Cobrar pelo WhatsApp pessoal é desconfortável. Lembrar cada paciente manualmente consome tempo e mistura vida pessoal com profissional.' },
    { title: 'Histórico espalhado', description: 'Reconstruir o acompanhamento de um paciente vira trabalho à parte quando o histórico está em anotações espalhadas.' },
  ],
  solutionTitle: 'Tudo que seu consultório de psicologia precisa em um só lugar.',
  solutionSub: 'Pensado para psicólogos que trabalham com sessões recorrentes e acompanhamento de longo prazo.',
  features: [
    { title: 'Confirmações automáticas pelo WhatsApp', description: 'Lembretes 48h, 24h e 2h antes. O paciente confirma, cancela ou solicita reagendamento direto pelo WhatsApp.' },
    { title: 'Sessões recorrentes já configuradas', description: 'Cadastre o paciente e defina a recorrência semanal. A agenda se organiza automaticamente — sem remarcar toda semana.' },
    { title: 'Ficha e histórico centralizado', description: 'Cada paciente tem perfil com histórico completo de sessões, anotações e evolução. Tudo em um lugar.' },
    { title: 'Pagamento online sem constrangimento', description: 'O paciente paga via PIX ou cartão antes da sessão, direto pela plataforma. Nada de cobranças por mensagem.' },
    { title: 'WhatsApp Oficial — sem risco de ban', description: 'O Aseno usa a API oficial do WhatsApp. Seu número pessoal fica fora da operação, sem risco de bloqueio.' },
    { title: 'Teleconsulta via Google Meet', description: 'Atenda online com link gerado automaticamente para cada sessão. Sem gerar link manual.' },
  ],
  reasonsTitle: '3 motivos para usar o Aseno no seu consultório.',
  reasons: [
    { title: 'Agenda que se cuida sozinha', description: 'Sessões recorrentes configuradas uma vez, confirmações automáticas enviadas sem ação sua.' },
    { title: 'Seu número pessoal protegido', description: 'WhatsApp Oficial integrado — sem risco de ban no número que você usa com pacientes e família.' },
    { title: 'Histórico sempre acessível', description: 'Ficha completa de cada paciente em um clique, com evolução, sessões anteriores e anotações.' },
  ],
  whatsapp: {
    clinicName: 'Consultório Psicologia',
    messageIn: 'Olá Mariana! Lembrete: sua sessão de psicoterapia é amanhã às 08h. Confirma sua presença?',
    messageOut: 'Confirmo! Até amanhã',
    messageReply: 'Sua presença está confirmada. Até amanhã!',
  },
  testimonials: [
    { text: 'Desde que comecei a usar, minhas faltas caíram pela metade. A confirmação automática pelo WhatsApp mudou minha rotina.', author: 'Consultório Psicologia Integrada', role: 'Psicologia Clínica' },
    { text: 'O histórico centralizado é incrível. Antes eu perdia tempo procurando anotações. Agora tenho tudo em um clique antes de cada sessão.', author: 'Clínica Mente & Saúde', role: 'Psicoterapia' },
    { text: 'Não preciso mais cobrar pelo WhatsApp. O paciente recebe o link de pagamento e paga antes da sessão. Muito mais profissional.', author: 'Espaço Terapêutico Viver', role: 'Psicologia' },
  ],
  faqs: [
    { question: 'O Aseno funciona para psicólogo autônomo, não só para clínicas?', answer: 'Sim. O plano Básico atende até 5 profissionais e é usado tanto por consultórios individuais quanto por clínicas pequenas.' },
    { question: 'Preciso migrar todos os meus dados para começar a usar?', answer: 'Não. Você pode começar a cadastrar novos pacientes e ir organizando os ativos no seu ritmo. Importação disponível no plano Avançado.' },
    { question: 'O WhatsApp automático pode banir meu número?', answer: 'No plano Profissional, o Aseno usa a API Oficial do WhatsApp Business. Não há risco de bloqueio.' },
    { question: 'Preciso instalar algo?', answer: 'Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.' },
    { question: 'Funciona no celular?', answer: 'Sim. Interface totalmente responsiva em qualquer smartphone, tablet ou computador.' },
    { question: 'Preciso de cartão para testar?', answer: 'Não. 14 dias com acesso completo, sem cartão de crédito.' },
  ],
}

export default async function PsicologiaLandingPage(props: PageProps) {
  const params = await props.params
  return <SpecialtyTemplate lng={params.lng} data={data} />
}
