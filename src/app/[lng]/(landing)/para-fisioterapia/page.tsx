import type { Metadata } from 'next'
import { SpecialtyTemplate, SpecialtyData } from '../specialty-template'

export const metadata: Metadata = {
  title: 'Software para Clínicas de Fisioterapia | Aseno',
  description: 'Gerencie sessões, reduza faltas e acompanhe a evolução de cada paciente. O Aseno foi feito para clínicas de fisioterapia que trabalham com tratamentos contínuos.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

const data: SpecialtyData = {
  badge: 'Para clínicas de fisioterapia com tratamentos contínuos',
  heroTitle: 'Seus pacientes somem no meio do tratamento.',
  heroTitleAccent: 'O Aseno impede isso.',
  heroSub: 'Mantém pacientes em tratamento, reduz faltas e dá controle real da evolução de cada um — sem planilha ou WhatsApp manual.',
  heroNote: 'Sem cartão de crédito. Você configura em menos de um dia.',
  problemTitle: 'O resultado vem com continuidade. Mas o paciente some.',
  problems: [
    { title: 'Paciente abandona o tratamento', description: 'Chega com dor aguda, melhora nos primeiros atendimentos e para de aparecer. Sem aviso. Você só descobre quando o horário fica vago.' },
    { title: 'Evolução clínica espalhada', description: 'O que foi feito na sessão anterior, quais exercícios foram prescritos — vira um exercício de memória quando a ficha está em papel ou espalhada.' },
    { title: 'Confirmação manual o dia inteiro', description: 'Recepcionista no WhatsApp um a um, pergunta se o paciente vem, espera resposta, anota. Isso custa tempo que poderia estar no atendimento.' },
  ],
  solutionTitle: 'Tudo que sua clínica de fisioterapia precisa em um só lugar.',
  solutionSub: 'Pensado para clínicas que trabalham com tratamentos contínuos e sessões recorrentes.',
  features: [
    { title: 'Sessões recorrentes com plano de tratamento', description: 'Cadastre o plano de sessões e agende os atendimentos de forma sequencial. Não precisa remarcar um a um toda semana.' },
    { title: 'Ficha e histórico do paciente', description: 'Cada paciente tem ficha clínica com histórico completo de atendimentos. Registre evolução e observações — acessível por qualquer dispositivo.' },
    { title: 'Confirmação automática via WhatsApp', description: 'Lembretes 48h, 24h e 2h antes de cada sessão. Paciente confirma ou cancela e o sistema atualiza a agenda em tempo real.' },
    { title: 'Detector de risco de faltas', description: 'Identifica pacientes com padrão de ausência ou baixa adesão e sinaliza antes que abandonem o tratamento.' },
    { title: 'Controle de acesso por perfil', description: 'Cada fisioterapeuta acessa apenas sua agenda e seus pacientes. Você mantém visão geral sem abrir informação para toda a equipe.' },
    { title: 'Teleconsulta e orientação remota', description: 'Para sessões de orientação ou reavaliação: gere o link de Google Meet direto pelo Aseno, sem sair do sistema.' },
  ],
  reasonsTitle: '3 motivos para usar o Aseno na sua clínica.',
  reasons: [
    { title: 'Tratamentos que chegam ao fim', description: 'Planos de sessão organizados e alertas de risco de abandono para manter o paciente no fluxo.' },
    { title: 'Histórico clínico acessível', description: 'Ficha completa por paciente, com evolução registrada em cada atendimento — sem papel, sem retrabalho.' },
    { title: 'Agenda que se confirma sozinha', description: 'Lembretes automáticos por WhatsApp eliminam a confirmação manual e liberam tempo da equipe.' },
  ],
  whatsapp: {
    clinicName: 'Clínica Fisioterapia',
    messageIn: 'Olá Carlos! Lembrete: sua sessão de RPG é amanhã às 08h (sessão 5 de 12). Confirma sua presença?',
    messageOut: 'Confirmo! Já estou sentindo melhora na postura',
    messageReply: 'Sua presença está confirmada. Até amanhã!',
  },
  testimonials: [
    { text: 'Desde que implementamos, nossas faltas caíram drasticamente. A confirmação automática pelo WhatsApp é incrível — não precisamos mais ligar para cada paciente.', name: 'Camila Ferreira', role: 'Fisioterapeuta', clinic: 'Clínica FisioVida', photo: 'https://i.pravatar.cc/96?img=5' },
    { text: 'O controle do plano de tratamento mudou tudo. Antes eu perdia paciente no meio da reabilitação. Agora vejo quem está em risco de abandonar.', name: 'Henrique Souza', role: 'Diretor Clínico', clinic: 'Instituto de Reabilitação Postural', photo: 'https://i.pravatar.cc/96?img=8' },
    { text: 'Ter o histórico clínico acessível em qualquer dispositivo economiza tempo entre atendimentos. Não preciso mais procurar fichas em papel.', name: 'Juliana Lima', role: 'Coordenadora Clínica', clinic: 'Clínica Movimento & Saúde', photo: 'https://i.pravatar.cc/96?img=1' },
  ],
  faqs: [
    { question: 'O Aseno funciona para fisioterapeuta autônomo, sem clínica?', answer: 'Sim. O plano Básico atende até 3 profissionais e é usado tanto por clínicas pequenas quanto por fisioterapeutas independentes.' },
    { question: 'Preciso migrar todos os dados do meu sistema atual?', answer: 'Não necessariamente. Você pode começar do zero. Se quiser importar sua base, isso está disponível no plano Avançado com suporte.' },
    { question: 'O WhatsApp automático pode ser banido?', answer: 'No plano Profissional, o Aseno usa o WhatsApp Oficial (API oficial da Meta), o que elimina o risco de banimento.' },
    { question: 'Preciso instalar algo?', answer: 'Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.' },
    { question: 'Funciona no celular?', answer: 'Sim. Interface totalmente responsiva em qualquer smartphone, tablet ou computador.' },
    { question: 'Preciso de cartão para testar?', answer: 'Não. 14 dias com acesso completo, sem cartão de crédito.' },
  ],
}

export default async function FisioterapiaLandingPage(props: PageProps) {
  const params = await props.params
  return <SpecialtyTemplate lng={params.lng} data={data} />
}
