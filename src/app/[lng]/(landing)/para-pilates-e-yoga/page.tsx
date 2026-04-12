import type { Metadata } from 'next'
import { SpecialtyTemplate, SpecialtyData } from '../specialty-template'

export const metadata: Metadata = {
  title: 'Software de Gestão para Estúdios de Pilates e Yoga | Aseno',
  description: 'Agenda por instrutor, sessões recorrentes, confirmação automática no WhatsApp e lista de espera. Gestão simples para estúdios de Pilates e Yoga.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

const data: SpecialtyData = {
  badge: 'Para estúdios de Pilates e Yoga',
  heroTitle: 'Chega de gerenciar aula por planilha e falta por WhatsApp.',
  heroTitleAccent: 'O Aseno organiza seu estúdio.',
  heroSub: 'Organiza a agenda do estúdio, confirma presença automaticamente e preenche vagas sem você precisar fazer nada.',
  heroNote: 'Sem cartão de crédito. Configuração em menos de 1 hora.',
  problemTitle: 'Você sabe quantas vagas foram desperdiçadas essa semana?',
  problems: [
    { title: 'Planilha com aba por instrutor', description: 'A agenda que parecia simples virou uma planilha com aba por instrutor, outra por turma e outra para as reposições que nunca fecham.' },
    { title: 'Trocas e faltas no WhatsApp', description: 'Quando o aluno pede para trocar de horário, o processo inteiro cai no WhatsApp — e você faz a mediação de algo que deveria ser automático.' },
    { title: 'Frequência sem controle real', description: 'Controlar frequência por aluno, saber quem está com muitas faltas, organizar lista de espera: tudo toma tempo que poderia ser usado na sala.' },
  ],
  solutionTitle: 'Tudo que seu estúdio de Pilates e Yoga precisa em um só lugar.',
  solutionSub: 'Feito para quem trabalha com sessões recorrentes — estúdios de Pilates e Yoga são exatamente esse perfil.',
  features: [
    { title: 'Agenda por instrutor, sem confusão', description: 'Cada instrutor tem sua própria agenda dentro do sistema. Você visualiza tudo em um só lugar, sem cruzar planilhas.' },
    { title: 'Sessões recorrentes configuradas uma vez', description: 'Cadastre o aluno em horário fixo e as sessões seguintes são geradas automaticamente. Sem redigitar toda semana.' },
    { title: 'Confirmação automática pelo WhatsApp', description: 'Lembretes 48h, 24h e 2h antes da aula. Aluno confirma, cancela ou pede reposição direto pelo celular.' },
    { title: 'Lista de espera sem trabalho manual', description: 'Quando um horário abre, o sistema notifica automaticamente quem está esperando.' },
    { title: 'Portal do aluno para autoagendamento', description: 'O aluno agenda, reagenda ou cancela pelo celular, a qualquer hora. Sem depender da recepção.' },
    { title: 'Controle de acesso por perfil', description: 'Instrutores veem apenas a própria agenda. Gestão financeira e relatórios ficam visíveis só para quem você definir.' },
  ],
  reasonsTitle: '3 motivos para usar o Aseno no seu estúdio.',
  reasons: [
    { title: 'Agenda organizada por instrutor', description: 'Cada profissional tem sua visão, você tem o controle de tudo.' },
    { title: 'Menos falta, menos trabalho', description: 'Confirmações automáticas reduzem o não comparecimento sem depender de ninguém.' },
    { title: 'Vagas preenchidas sozinhas', description: 'A lista de espera automática avisa o próximo aluno quando um horário abre.' },
  ],
  whatsapp: {
    clinicName: 'Estúdio Pilates & Yoga',
    messageIn: 'Olá Mariana! Lembrete: sua aula de Pilates Solo é amanhã às 07h (sessão 3 de 12). Confirma sua presença?',
    messageOut: 'Confirmo! Até amanhã',
    messageReply: 'Presença confirmada. Até amanhã, Mariana!',
  },
  testimonials: [
    { text: 'As faltas caíram pela metade desde que ativamos a confirmação automática. Os alunos adoram receber o lembrete no WhatsApp.', author: 'Studio Corpo em Equilíbrio', role: 'Pilates' },
    { text: 'Antes eu gastava horas organizando a agenda de 3 instrutores em planilha. Agora cada um vê a própria agenda e eu tenho visão de tudo.', author: 'Espaço Yoga & Movimento', role: 'Yoga e Pilates' },
    { text: 'A lista de espera automática mudou tudo. Quando alguém cancela, a vaga é preenchida sem eu precisar ligar para ninguém.', author: 'Pilates Studio Viva', role: 'Pilates' },
  ],
  faqs: [
    { question: 'O Aseno funciona para turmas coletivas de Pilates e Yoga?', answer: 'Sim. Você configura horários por turma e por instrutor, com número máximo de alunos por sessão. Lista de espera e autoagendamento funcionam para esses formatos.' },
    { question: 'Preciso migrar todos os dados do meu sistema atual?', answer: 'No plano Avançado, a equipe do Aseno faz a importação. Nos demais planos, o onboarding guiado ajuda a configurar tudo do zero.' },
    { question: 'Como funciona o preço? Pago por aluno ou por instrutor?', answer: 'O plano é fixo por clínica, não por profissional. Básico: até 3 instrutores. Profissional: até 7. Avançado: até 14.' },
    { question: 'Preciso instalar algo?', answer: 'Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.' },
    { question: 'Funciona no celular?', answer: 'Sim. Interface totalmente responsiva em qualquer smartphone, tablet ou computador.' },
    { question: 'Preciso de cartão para testar?', answer: 'Não. 14 dias com acesso completo, sem cartão de crédito.' },
  ],
}

export default async function PilatesYogaLandingPage(props: PageProps) {
  const params = await props.params
  return <SpecialtyTemplate lng={params.lng} data={data} />
}
