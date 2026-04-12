import type { Metadata } from 'next'
import { SpecialtyTemplate, SpecialtyData } from '../specialty-template'

export const metadata: Metadata = {
  title: 'Software para Clínicas de Estética | Aseno',
  description: 'Gerencie protocolos, reduza faltas e mantenha seus pacientes voltando. Software de gestão feito para clínicas de estética com sessões recorrentes.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

const data: SpecialtyData = {
  badge: 'Para clínicas de estética com sessões recorrentes',
  heroTitle: 'Sua agenda cheia não adianta nada se o paciente faz uma sessão e some.',
  heroTitleAccent: 'O Aseno mantém o protocolo no trilho.',
  heroSub: 'Organiza protocolos, confirma sessões automaticamente e mantém o paciente comprometido com o tratamento — sem você correr atrás.',
  heroNote: 'Sem cartão de crédito. Você configura em menos de um dia.',
  problemTitle: 'O resultado vem com continuidade. Mas o paciente some.',
  problems: [
    { title: 'Paciente abandona o protocolo', description: 'Faz a primeira sessão, gosta, some por duas semanas e quando volta já perdeu boa parte do progresso — do protocolo e da sua receita.' },
    { title: 'Controle de sessões no caos', description: 'Planilha, caderno, post-it, memória. Quando a clínica cresce, esse controle quebra. Você não sabe quem está no meio do protocolo e quem abandonou.' },
    { title: 'Agenda com buracos', description: 'Dias com sala cheia e outros com buracos porque dois ou três pacientes confirmaram e não apareceram. Sem tempo de ligar para cada um.' },
  ],
  solutionTitle: 'Tudo que sua clínica de estética precisa em um só lugar.',
  solutionSub: 'Pensado para clínicas que trabalham com protocolos e sessões recorrentes.',
  features: [
    { title: 'Sessões recorrentes por protocolo', description: 'Configure o protocolo uma vez — número de sessões, frequência, procedimento — e o sistema acompanha o andamento automaticamente.' },
    { title: 'Confirmação automática via WhatsApp', description: 'Lembretes 48h, 24h e 2h antes. No plano Profissional, WhatsApp Oficial com IA que entende as respostas do paciente.' },
    { title: 'Detector de risco de faltas', description: 'Identifica pacientes com padrão de ausência antes de o horário ser perdido. Você age antes — e a sala não fica vazia.' },
    { title: 'Lista de espera automática', description: 'Cancelamento de última hora? O sistema avisa quem está na lista de espera. O horário se preenche sozinho.' },
    { title: 'Pagamentos na hora, sem constrangimento', description: 'PIX e cartão direto pelo portal do paciente. Você recebe antes ou no dia da sessão, sem cobrar pessoalmente.' },
    { title: 'Portal do paciente e agendamento 24/7', description: 'Seu paciente agenda no horário que prefere — via link na bio, sem depender de você estar disponível.' },
  ],
  reasonsTitle: '3 motivos para usar o Aseno na sua clínica de estética.',
  reasons: [
    { title: 'Controle de protocolo real', description: 'Veja exatamente em qual sessão cada paciente está, por procedimento, sem planilha.' },
    { title: 'Zero falta sem esforço', description: 'Confirmações automáticas via WhatsApp cuidam da presença para você.' },
    { title: 'Receba antes de atender', description: 'Pagamento online por PIX ou cartão direto no agendamento, sem cobrar na hora.' },
  ],
  whatsapp: {
    clinicName: 'Clínica Estética',
    messageIn: 'Olá Camila! Lembrete: sua sessão de radiofrequência é amanhã às 14h (sessão 4 de 10). Confirma sua presença?',
    messageOut: 'Confirmo sim! Estou adorando os resultados',
    messageReply: 'Sua presença está confirmada. Até amanhã!',
  },
  testimonials: [
    { text: 'Desde que implementamos, nossas faltas caíram drasticamente. A confirmação automática pelo WhatsApp é incrível.', author: 'Clínica Vitalitá', role: 'Estética e Dermatologia' },
    { text: 'O controle de protocolos mudou tudo. Antes eu perdia paciente no meio do tratamento e nem sabia. Agora vejo tudo no painel.', author: 'Studio Beleza & Saúde', role: 'Estética Corporal' },
    { text: 'A lista de espera automática é fantástica. Quando uma paciente cancela, o sistema preenche a vaga rápido.', author: 'Clínica Derma Corpo', role: 'Estética Avançada' },
  ],
  faqs: [
    { question: 'O Aseno funciona para clínicas que têm vários tipos de protocolo ao mesmo tempo?', answer: 'Sim. Você cadastra quantos protocolos quiser — drenagem linfática, radiofrequência, criolipólise, skincare — e acompanha cada paciente de forma independente. Um paciente pode estar em dois protocolos ao mesmo tempo, e o sistema mantém o controle separado.' },
    { question: 'Preciso trocar meu número de WhatsApp para usar as confirmações automáticas?', answer: 'Não. No plano Profissional, você conecta um número dedicado com WhatsApp Oficial. Seu número pessoal fica separado e sem risco de bloqueio pelo Meta.' },
    { question: 'Quanto custa para uma clínica com 4 profissionais?', answer: 'Para 4 profissionais, o plano indicado é o Profissional (até 7 profissionais), com agenda ilimitada, agendamento online, portal do paciente e confirmações automáticas. O preço é por clínica, não por profissional.' },
    { question: 'Preciso instalar algo?', answer: 'Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.' },
    { question: 'Funciona no celular?', answer: 'Sim. Interface totalmente responsiva em qualquer smartphone, tablet ou computador.' },
    { question: 'Preciso de cartão para testar?', answer: 'Não. 14 dias com acesso completo, sem cartão de crédito.' },
  ],
}

export default async function EsteticaLandingPage(props: PageProps) {
  const params = await props.params
  return <SpecialtyTemplate lng={params.lng} data={data} />
}
