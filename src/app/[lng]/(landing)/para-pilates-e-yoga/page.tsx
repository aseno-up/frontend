import type { Metadata } from 'next'
import { HeroCTA, NavCTA, PricingSection, CtaSection } from '../landing-client'
import { LandingFooter } from '../landing-footer'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Software de Gestão para Estúdios de Pilates e Yoga | Aseno',
  description: 'Agenda por instrutor, sessões recorrentes, confirmação automática no WhatsApp e lista de espera. Gestão simples para estúdios de Pilates e Yoga.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

export default async function PilatesYogaLandingPage(props: PageProps) {
  const params = await props.params

  return (
    <div className="landing-body">
      <nav className="landing-nav">
        <a href="/" className="nav-logo">aseno<div className="nav-logo-dot"></div></a>
        <ul className="nav-links">
          <li><a href="#solucao">Solução</a></li>
          <li><a href="#beneficios">Benefícios</a></li>
          <li><a href="#precos">Planos</a></li>
        </ul>
        <NavCTA lng={params.lng} />
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge"><div className="hero-badge-dot"></div>Para estúdios de Pilates e Yoga</div>
          <h1 className="hero-title">Chega de gerenciar aula por planilha e falta por <span className="a1">WhatsApp</span></h1>
          <p className="hero-sub">O Aseno organiza a agenda do seu estúdio, confirma presença automaticamente e preenche vagas sem você precisar fazer nada.</p>
          <HeroCTA lng={params.lng} />
          <p className="hero-note">Sem cartão de crédito. Configuração em menos de 1 hora.</p>
        </div>
        <div className="mkp-wrap">
          <div className="mkp-glow"></div>
          <div className="mkp-card">
            <div className="mkp-bar">
              <div className="dot dot-r"></div><div className="dot dot-y"></div><div className="dot dot-g"></div>
              <div className="mkp-url"><span>app.aseno.com.br/agenda</span></div>
            </div>
            <div className="mkp-body">
              <div className="mk-stats">
                <div className="mk-stat"><div className="mk-stat-lbl">Hoje</div><div className="mk-stat-val b">12</div></div>
                <div className="mk-stat"><div className="mk-stat-lbl">Confirmados</div><div className="mk-stat-val g">10</div></div>
                <div className="mk-stat"><div className="mk-stat-lbl">Pendentes</div><div className="mk-stat-val y">2</div></div>
              </div>
              <div className="mk-grid">
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Próximos alunos</div>
                  <div className="mk-row"><span className="mk-row-n">Mariana Costa — 07:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Juliana Alves — 08:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Renata Souza — 09:00</span><span className="bdg bdg-y">Pendente</span></div>
                </div>
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Aulas do dia</div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Mariana — Pilates Solo 3/12</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Juliana — Yoga Vinyasa 8/8</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Renata — Pilates Aparelho 1/10</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="stats-inner">
          <div className="stat-item"><div className="stat-num">50%</div><div className="stat-lbl">Redução de faltas</div></div>
          <div className="stat-item"><div className="stat-num">3h</div><div className="stat-lbl">Economizadas por dia</div></div>
          <div className="stat-item"><div className="stat-num">95%</div><div className="stat-lbl">Taxa de confirmação</div></div>
          <div className="stat-item"><div className="stat-num">24/7</div><div className="stat-lbl">Agendamento online</div></div>
        </div>
        <p className="stats-note">*Resultados médios observados em estúdios ativos</p>
      </div>

      <section className="sec sec-alt">
        <div className="sec-hd">
          <span className="eyebrow">O problema</span>
          <h2 className="sec-title">Você sabe quantas vagas foram <span className="a1">desperdiçadas</span> essa semana?</h2>
          <p className="sec-sub">Na maioria dos estúdios, essa conta nunca é feita — e o prejuízo passa despercebido.</p>
        </div>
        <div className="feat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', maxWidth: '900px', margin: '0 auto' }}>
          <div className="feat-card">
            <div className="feat-icon">📋</div>
            <h3>Planilha com aba por instrutor, turma e reposição</h3>
            <p>A agenda que parecia simples virou uma planilha com aba por instrutor, outra por turma e outra para as reposições que nunca fecham direito.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📱</div>
            <h3>Trocas e faltas caem no WhatsApp</h3>
            <p>Quando o aluno pede para trocar de horário, o processo inteiro cai no WhatsApp — e você acaba fazendo a mediação de algo que deveria ser automático.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🕳️</div>
            <h3>Frequência sem controle real</h3>
            <p>Controlar frequência por aluno, saber quem está com muitas faltas, organizar a lista de espera sem esquecer ninguém: tudo isso toma tempo que você poderia usar dentro da sala.</p>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      <section className="sec" id="solucao">
        <div className="sec-hd">
          <span className="eyebrow">A solução</span>
          <h2 className="sec-title">Tudo que seu estúdio de Pilates e Yoga precisa<br/><span className="a2">em um só lugar</span></h2>
          <p className="sec-sub">O Aseno foi feito para quem trabalha com sessões recorrentes — e estúdios de Pilates e Yoga são exatamente esse perfil.</p>
        </div>
        <div className="feat-grid">
          <div className="feat-card">
            <div className="feat-icon">📅</div>
            <h3>Agenda por instrutor, sem confusão</h3>
            <p>Cada instrutor tem sua própria agenda dentro do sistema. Você visualiza tudo em um só lugar, sem precisar cruzar planilhas ou pedir atualização manual.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔄</div>
            <h3>Sessões recorrentes configuradas uma vez</h3>
            <p>Cadastre o aluno em um horário fixo e as sessões seguintes são geradas automaticamente. Sem redigitar toda semana.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">💬</div>
            <h3>Confirmação automática pelo WhatsApp</h3>
            <p>O sistema envia lembretes 48h, 24h e 2h antes da aula — sem você precisar fazer isso manualmente. Aluno confirma, cancela ou pede reposição direto pelo celular.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">⏰</div>
            <h3>Lista de espera sem trabalho manual</h3>
            <p>Quando um horário abre, o sistema notifica automaticamente quem está esperando. Você não precisa lembrar de ninguém.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📲</div>
            <h3>Portal do aluno para autoagendamento</h3>
            <p>O aluno agenda, reagenda ou cancela pelo próprio celular, a qualquer hora. Sem depender da recepção e sem lotar o WhatsApp do estúdio.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔒</div>
            <h3>Controle de acesso por perfil</h3>
            <p>Instrutores veem apenas a própria agenda. A gestão financeira e os relatórios ficam visíveis só para quem você definir.</p>
          </div>
        </div>
      </section>

      <section className="sec sec-alt" id="beneficios">
        <div className="demo-inner">
          <div className="demo-text">
            <span className="eyebrow" style={{ display: 'block' }}>Por que o Aseno</span>
            <h2 className="sec-title" style={{ textAlign: 'left' }}>3 motivos para usar<br/>o <span className="a1">Aseno</span> no seu estúdio</h2>
            <div className="checklist">
              <div className="chk"><div className="chk-ic">🗓️</div><span><strong>Agenda organizada por instrutor</strong> — Cada profissional tem sua visão, você tem o controle de tudo.</span></div>
              <div className="chk"><div className="chk-ic">📲</div><span><strong>Menos falta, menos trabalho</strong> — Confirmações automáticas reduzem o não comparecimento sem depender de ninguém lembrar de mandar mensagem.</span></div>
              <div className="chk"><div className="chk-ic">🔄</div><span><strong>Vagas preenchidas sozinhas</strong> — A lista de espera automática avisa o próximo aluno quando um horário abre.</span></div>
            </div>
          </div>
          <div>
            <div className="phone-wrap">
              <div className="phone-hd">
                <div className="phone-av">💬</div>
                <div><div className="phone-nm">Estúdio Pilates & Yoga</div><div className="phone-st">● Online</div></div>
              </div>
              <div className="msgs">
                <div className="msg msg-in">Olá Mariana! Lembrete: sua aula de Pilates Solo é amanhã às 07h (sessão 3 de 12). Confirma sua presença?<div className="msg-time">18:00</div></div>
                <div className="msg msg-out">Confirmo! Até amanhã 🧘‍♀️<div className="msg-time">18:05</div></div>
                <div className="msg msg-in">Presença confirmada. Até amanhã, Mariana!<div className="msg-time">18:05</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec testi-sec">
        <div className="sec-hd">
          <span className="eyebrow">Depoimentos</span>
          <h2 className="sec-title">Quem usa, <span className="a1">recomenda</span></h2>
          <p className="sec-sub">Estúdios de Pilates e Yoga que transformaram sua gestão com o Aseno.</p>
        </div>
        <div className="testi-grid">
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">As faltas caíram pela metade desde que ativamos a confirmação automática. Os alunos adoram receber o lembrete no WhatsApp.</p><div className="testi-auth">Studio Corpo em Equilíbrio</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Antes eu gastava horas organizando a agenda de 3 instrutores em planilha. Agora cada um vê a própria agenda e eu tenho visão de tudo.</p><div className="testi-auth">Espaço Yoga & Movimento</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">A lista de espera automática mudou tudo. Quando alguém cancela, a vaga é preenchida sem eu precisar ligar para ninguém.</p><div className="testi-auth">Pilates Studio Viva</div></div>
        </div>
      </section>

      <PricingSection lng={params.lng} />

      <section className="sec" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
        <div className="sec-hd" style={{ marginBottom: '2.5rem' }}>
          <span className="eyebrow">Dúvidas</span>
          <h2 className="sec-title">Perguntas <span className="a2">frequentes</span></h2>
        </div>
        <div className="faq-grid">
          <details className="faq-item"><summary>O Aseno funciona para turmas coletivas de Pilates e Yoga?</summary><p>Sim. Você pode configurar horários por turma e por instrutor, com número máximo de alunos por sessão. A lista de espera e o autoagendamento funcionam para esses formatos.</p></details>
          <details className="faq-item"><summary>Preciso migrar todos os dados do meu sistema atual?</summary><p>No plano Avançado, a equipe do Aseno faz a importação dos dados do sistema anterior. Nos planos Básico e Profissional, o onboarding guiado ajuda você a configurar tudo do zero em pouco tempo.</p></details>
          <details className="faq-item"><summary>Como funciona o preço? Pago por aluno ou por instrutor?</summary><p>O plano é fixo por clínica, não por profissional. No plano Básico você tem até 5 instrutores. No Profissional, até 15. No Avançado, ilimitado — incluindo múltiplas unidades.</p></details>
          <details className="faq-item"><summary>Preciso instalar algo?</summary><p>Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.</p></details>
          <details className="faq-item"><summary>Funciona no celular?</summary><p>Sim. Interface totalmente responsiva em qualquer smartphone, tablet ou computador.</p></details>
          <details className="faq-item"><summary>Preciso de cartão para testar?</summary><p>Não. 14 dias com acesso completo, sem cartão de crédito.</p></details>
        </div>
      </section>

      <CtaSection lng={params.lng} />

      <LandingFooter />
    </div>
  )
}
