import type { Metadata } from 'next'
import { SpecialtyTemplate, SpecialtyData } from '../specialty-template'

export const metadata: Metadata = {
  title: 'Software de Gestão para Nutricionistas | Aseno',
  description: 'Controle agenda, retornos, teleconsultas e cobranças da sua clínica de nutrição em um único lugar. Sem planilha, sem WhatsApp manual.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

const data: SpecialtyData = {
  badge: 'Para nutricionistas e clínicas de nutrição',
  heroTitle: 'O paciente saiu da consulta. Ele vai voltar para o retorno?',
  heroTitleAccent: 'Com o Aseno, volta.',
  heroSub: 'O próprio paciente agenda o retorno — e você recebe confirmação automática, pagamento garantido e sem depender de lembrança manual.',
  heroNote: 'Sem cartão de crédito. Você configura em menos de um dia.',
  problemTitle: 'O retorno é onde a maioria das clínicas de nutrição perde paciente.',
  problems: [
    { title: 'Paciente some depois da primeira consulta', description: 'Você faz uma consulta completa, monta o plano alimentar, combina retorno em 30 dias. Mas quando chega a hora, ninguém lembra.' },
    { title: 'Agenda presencial e teleconsulta viram caos', description: 'Segunda presencial, quinta online, sexta a paciente pediu para mudar pelo Instagram. Você anota onde consegue e no fim não sabe o que ficou combinado.' },
    { title: 'Cobrança via PIX manual não é processo', description: 'Manda a chave, aguarda comprovante, confere, responde. Para cada paciente, toda semana. Sem relatório.' },
  ],
  solutionTitle: 'Tudo que sua clínica de nutrição precisa em um só lugar.',
  solutionSub: 'Resolve cada um desses pontos sem que você precise mudar tudo de uma vez.',
  features: [
    { title: 'Retornos que não somem', description: 'O Aseno registra a frequência do ciclo do paciente (30, 60 ou 90 dias) e o paciente recebe o link para agendar o próximo retorno.' },
    { title: 'Confirmações automáticas pelo WhatsApp', description: '48h, 24h e 2h antes da consulta. No plano Profissional, a IA entende as respostas naturais do paciente.' },
    { title: 'Teleconsulta integrada', description: 'Google Meet com link gerado automaticamente dentro do sistema. Sem copiar e colar no WhatsApp.' },
    { title: 'Pagamento online sem trabalho manual', description: 'O paciente paga por PIX ou cartão no agendamento. Controle financeiro dentro do Aseno — entradas, pendências e histórico.' },
    { title: 'Detector de risco de faltas', description: 'Identifica pacientes com padrão que antecede falta — e te avisa antes do horário chegar.' },
    { title: 'Portal do paciente e agendamento 24/7', description: 'Seu paciente agenda no horário que prefere — via link na bio, sem depender de você estar disponível.' },
  ],
  reasonsTitle: '3 motivos para usar o Aseno no seu consultório.',
  reasons: [
    { title: 'Retorno garantido', description: 'O paciente agenda o próprio retorno pelo link da clínica — sem depender de mensagem manual sua.' },
    { title: 'Zero confirmação manual', description: 'WhatsApp automático nos momentos certos. Você só entra em contato quando realmente precisa.' },
    { title: 'Cobrança no ato do agendamento', description: 'PIX e cartão integrados. O horário só é confirmado com o pagamento feito.' },
  ],
  whatsapp: {
    clinicName: 'Consultório Nutrição',
    messageIn: 'Olá Juliana! Lembrete: seu retorno nutricional é amanhã às 09h. Confirma sua presença?',
    messageOut: 'Confirmo! Já estou seguindo o plano direitinho',
    messageReply: 'Presença confirmada. Até amanhã!',
  },
  testimonials: [
    { text: 'Meus pacientes agora agendam o retorno sozinhos. Parei de perder retornos de 30 dias e minha taxa de retenção melhorou muito.', author: 'Clínica NutriVida', role: 'Nutrição Clínica' },
    { text: 'A confirmação automática pelo WhatsApp é incrível. Antes eu passava horas ligando para confirmar, agora o sistema faz tudo.', author: 'Consultório Equilíbrio', role: 'Nutrição Esportiva' },
    { text: 'O pagamento online mudou tudo. Paciente paga na hora de agendar e eu não preciso mais ficar cobrando por PIX no WhatsApp.', author: 'NutriCenter Saúde', role: 'Nutrição' },
  ],
  faqs: [
    { question: 'O Aseno funciona para nutricionista autônoma, sem clínica?', answer: 'Sim. O plano Básico atende até 3 profissionais e já inclui tudo que você precisa para começar.' },
    { question: 'Consigo migrar minha agenda atual para o Aseno?', answer: 'No plano Avançado, a importação de dados do sistema anterior está incluída com suporte da equipe.' },
    { question: 'Meus pacientes precisam baixar algum aplicativo?', answer: 'Não. O paciente acessa o Portal pelo navegador do celular, sem instalar nada.' },
    { question: 'Preciso instalar algo?', answer: 'Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.' },
    { question: 'Funciona no celular?', answer: 'Sim. Interface totalmente responsiva em qualquer smartphone, tablet ou computador.' },
    { question: 'Preciso de cartão para testar?', answer: 'Não. 14 dias com acesso completo, sem cartão de crédito.' },
  ],
}

export default async function NutricaoLandingPage(props: PageProps) {
  const params = await props.params
  return <SpecialtyTemplate lng={params.lng} data={data} />
}
