import type { Metadata } from 'next'
import { SpecialtyTemplate, SpecialtyData } from '../specialty-template'

export const metadata: Metadata = {
  title: 'Agenda Online para Pacientes | Aseno',
  description: 'Seus pacientes agendam sozinhos, 24 horas por dia. Confirmação automática por WhatsApp e menos faltas. Teste grátis por 14 dias.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

const data: SpecialtyData = {
  badge: 'Agendamento online para clínicas com sessões recorrentes',
  heroTitle: 'Seus pacientes ainda ligam para marcar horário?',
  heroTitleAccent: 'Com o Aseno, agendam sozinhos. 24/7.',
  heroSub: 'Sua clínica recebe agendamentos 24 horas por dia, confirma automaticamente pelo WhatsApp e reduz faltas — sem sua equipe atender o telefone.',
  heroNote: 'Sem cartão de crédito. Você configura em menos de um dia.',
  problemTitle: 'Sua equipe ainda perde tempo atendendo telefone.',
  problems: [
    { title: 'Telefone tocando o dia inteiro', description: 'Enquanto você atende um paciente, a recepcionista está ao telefone marcando o próximo. Fora do horário comercial, ninguém atende — e o paciente agenda em outro lugar.' },
    { title: 'Faltas que ninguém previu', description: 'O paciente confirmou pelo WhatsApp pessoal, mas não apareceu. Você só descobre quando olha a sala vazia. Nenhuma lista de espera foi acionada.' },
    { title: 'Controle manual que não escala', description: 'Agenda de papel, planilha, WhatsApp pessoal. Funciona com 5 pacientes por dia, mas quando a clínica cresce, os erros crescem junto.' },
  ],
  solutionTitle: 'Agendamento online que funciona enquanto você atende.',
  solutionSub: 'Seus pacientes agendam sozinhos, recebem confirmação automática e você foca no que importa.',
  features: [
    { title: 'Portal do paciente 24/7', description: 'Seu paciente acessa o portal, escolhe o profissional, o horário e agenda sozinho — a qualquer hora, sem depender da recepção.' },
    { title: 'Confirmação automática via WhatsApp', description: 'Lembretes 48h, 24h e 2h antes. No plano Profissional, WhatsApp Oficial com IA que entende respostas do paciente.' },
    { title: 'Link na bio que agenda direto', description: 'Coloque o link no Instagram, Google Meu Negócio ou onde quiser. O paciente clica, escolhe o horário e pronto.' },
    { title: 'Lista de espera automática', description: 'Cancelamento de última hora? O sistema avisa quem está na lista de espera. O horário se preenche sozinho.' },
    { title: 'Sessões recorrentes organizadas', description: 'Configure o tratamento uma vez e o sistema agenda as próximas automaticamente. Veja quem está em dia e quem parou.' },
    { title: 'Detector de risco de faltas', description: 'Identifica pacientes com padrão de ausência antes de o horário ser perdido. Você age antes — e a sala não fica vazia.' },
  ],
  reasonsTitle: '3 motivos para automatizar seus agendamentos.',
  reasons: [
    { title: 'Agenda que nunca fecha', description: 'Seus pacientes agendam de madrugada, no fim de semana, no feriado. Você só abre o sistema e vê a agenda preenchida.' },
    { title: 'Menos falta, menos buraco', description: 'Confirmações automáticas pelo WhatsApp e lista de espera garantem que sua agenda não fique com horários vazios.' },
    { title: 'Recepção livre para o que importa', description: 'Sua equipe para de atender telefone o dia inteiro e foca no atendimento presencial.' },
  ],
  whatsapp: {
    clinicName: 'Sua Clínica',
    messageIn: 'Olá Lucas! Lembrete: sua sessão é amanhã às 09h (sessão 3 de 10). Confirma sua presença?',
    messageOut: 'Confirmado, obrigado!',
    messageReply: 'Presença confirmada. Até amanhã!',
  },
  testimonials: [
    { text: 'Antes eu perdia paciente porque ninguém atendia fora do horário. Agora recebo agendamentos até de madrugada pelo portal.', name: 'Ana Pereira', role: 'Esteticista', clinic: 'Clínica Vitalitá', photo: 'https://i.pravatar.cc/96?img=16' },
    { text: 'A confirmação automática pelo WhatsApp cortou nossas faltas pela metade. Minha recepcionista finalmente tem tempo para o que importa.', name: 'Vinícius Martins', role: 'Diretor', clinic: 'Studio Bem Estar', photo: 'https://i.pravatar.cc/96?img=64' },
    { text: 'Coloquei o link na bio do Instagram e os agendamentos dispararam. Simples assim.', name: 'Bruna Pereira', role: 'Coordenadora', clinic: 'Espaço Corpo & Mente', photo: 'https://i.pravatar.cc/96?img=68' },
  ],
  faqs: [
    { question: 'O paciente precisa instalar algum aplicativo para agendar?', answer: 'Não. O portal funciona direto no navegador, no celular ou computador. O paciente acessa o link, escolhe o horário e confirma — sem baixar nada.' },
    { question: 'Posso controlar quais horários ficam disponíveis?', answer: 'Sim. Você define horários por profissional, intervalos entre sessões e pode bloquear períodos específicos. O paciente só vê os horários que você liberou.' },
    { question: 'E se o paciente agendar e não aparecer?', answer: 'O Aseno envia confirmações automáticas por WhatsApp. Se o paciente não confirma, o detector de risco sinaliza e a lista de espera é acionada.' },
    { question: 'Preciso instalar algo?', answer: 'Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.' },
    { question: 'Funciona no celular?', answer: 'Sim. Interface totalmente responsiva em qualquer smartphone, tablet ou computador.' },
    { question: 'Preciso de cartão para testar?', answer: 'Não. 14 dias com acesso completo, sem cartão de crédito.' },
  ],
}

export default async function AgendaOnlineLandingPage(props: PageProps) {
  const params = await props.params
  return <SpecialtyTemplate lng={params.lng} data={data} />
}
