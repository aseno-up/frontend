import type { Metadata } from 'next'
import { SpecialtyTemplate, SpecialtyData } from '../specialty-template'

export const metadata: Metadata = {
  title: 'Software para Massoterapeuta e Quiropraxista | Aseno',
  description: 'Organize sua agenda, reduza faltas e receba pagamentos online. O Aseno foi feito para quem trabalha com sessões recorrentes.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

const data: SpecialtyData = {
  badge: 'Para massoterapeutas e quiropraxistas',
  heroTitle: 'Sua agenda de massoterapia não precisa viver no WhatsApp pessoal.',
  heroTitleAccent: 'O Aseno organiza tudo.',
  heroSub: 'Organiza agendamentos, confirma sessões automaticamente e mantém o histórico de cada paciente em um só lugar — para você focar no atendimento.',
  heroNote: 'Sem cartão de crédito. Você configura em menos de um dia.',
  problemTitle: 'Protocolo incompleto, paciente sumido. E a agenda no caos.',
  problems: [
    { title: 'Paciente some no meio do tratamento', description: 'Agenda via WhatsApp, faz uma sessão, desaparece por três semanas e volta reclamando que a dor voltou — sem ter completado o protocolo.' },
    { title: 'WhatsApp pessoal virou agenda', description: 'Confirmação misturada com cobrança. No fim do dia, você não sabe quantas sessões fez, quem deve, quem cancelou.' },
    { title: 'Histórico depende da memória', description: 'Sem registro organizado, você não lembra em qual sessão o paciente parou, o que foi feito e o que precisa ser retomado.' },
  ],
  solutionTitle: 'Tudo que você precisa para organizar seu consultório.',
  solutionSub: 'Pensado para quem trabalha com sessões recorrentes e protocolos de tratamento.',
  features: [
    { title: 'Agenda ilimitada, separada do WhatsApp', description: 'Cada profissional tem agenda digital própria. Pacientes agendam online pelo link do consultório, a qualquer hora.' },
    { title: 'Confirmações automáticas por WhatsApp', description: 'Lembretes 48h, 24h e 2h antes. No plano Profissional, a IA entende as respostas do paciente.' },
    { title: 'Sessões recorrentes com acompanhamento', description: 'Configure protocolos com múltiplas sessões e saiba exatamente onde cada paciente está no tratamento.' },
    { title: 'Pagamentos via PIX e cartão', description: 'O paciente paga online na hora do agendamento ou depois da sessão. Dashboard financeiro mostra entradas e inadimplência.' },
    { title: 'Landing page pública do consultório', description: 'Se você não tem site, o Aseno cria uma página profissional com link de agendamento. Pronto para a bio do Instagram.' },
    { title: 'Ficha clínica acessível antes do atendimento', description: 'Histórico completo do paciente, sessões anteriores e evolução do protocolo — tudo acessível antes de cada atendimento.' },
  ],
  reasonsTitle: '3 motivos para usar o Aseno no seu consultório.',
  reasons: [
    { title: 'Agenda sem caos', description: 'Seus horários organizados em um único lugar, com agendamento online 24/7 e confirmações automáticas.' },
    { title: 'Histórico que acompanha o tratamento', description: 'Ficha clínica e sessões anteriores acessíveis antes de cada atendimento, para retomar o protocolo sem depender da memória.' },
    { title: 'Cobranças sem desconforto', description: 'Pagamentos por PIX ou cartão integrados ao sistema, com controle financeiro em tempo real.' },
  ],
  whatsapp: {
    clinicName: 'Consultório Massoterapia',
    messageIn: 'Olá Ricardo! Lembrete: sua sessão de quiropraxia é amanhã às 14h (sessão 3 de 8). Confirma sua presença?',
    messageOut: 'Confirmo! Já estou sentindo melhora nas costas',
    messageReply: 'Sua presença está confirmada. Até amanhã!',
  },
  testimonials: [
    { text: 'Antes eu perdia pacientes no meio do protocolo e nem percebia. Agora vejo no painel quem parou e consigo retomar o contato a tempo.', author: 'Espaço Corpo & Equilíbrio', role: 'Massoterapia' },
    { text: 'A confirmação automática pelo WhatsApp reduziu muito as faltas. Meus pacientes confirmam sem eu precisar mandar mensagem.', author: 'Quiro Vida Clínica', role: 'Quiropraxia' },
    { text: 'O agendamento online mudou tudo. Meus pacientes agendam pela bio do Instagram e eu só recebo a notificação.', author: 'Studio Massoterapia Integral', role: 'Massoterapia' },
  ],
  faqs: [
    { question: 'O Aseno funciona para massoterapeuta autônomo, ou só para clínicas?', answer: 'Funciona para os dois. O plano Básico atende até 5 profissionais e já inclui agenda, confirmações automáticas e ficha de paciente.' },
    { question: 'Preciso ter site para usar o agendamento online?', answer: 'Não. O Aseno gera uma landing page pública do seu consultório com link direto para agendamento.' },
    { question: 'Meus pacientes antigos precisam baixar algum aplicativo?', answer: 'Não. O paciente acessa o Portal pelo navegador, sem instalar nada. As confirmações chegam por WhatsApp.' },
    { question: 'Preciso instalar algo?', answer: 'Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.' },
    { question: 'Funciona no celular?', answer: 'Sim. Interface totalmente responsiva em qualquer smartphone, tablet ou computador.' },
    { question: 'Preciso de cartão para testar?', answer: 'Não. 14 dias com acesso completo, sem cartão de crédito.' },
  ],
}

export default async function MassoterapiaLandingPage(props: PageProps) {
  const params = await props.params
  return <SpecialtyTemplate lng={params.lng} data={data} />
}
