import type { Metadata } from 'next'
import { HeroCTA, NavCTA, PricingSection, CtaSection } from '../landing-client'
import { LandingFooter } from '../landing-footer'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Software para Massoterapeuta e Quiropraxista | Aseno',
  description: 'Organize sua agenda, reduza faltas e receba pagamentos online. O Aseno foi feito para quem trabalha com sessões recorrentes.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

export default async function MassoterapiaLandingPage(props: PageProps) {
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
          <div className="hero-badge"><div className="hero-badge-dot"></div>Para massoterapeutas e quiropraxistas</div>
          <h1 className="hero-title">Sua agenda de massoterapia não precisa viver no <span className="a1">WhatsApp pessoal</span></h1>
          <p className="hero-sub">O Aseno organiza seus agendamentos, confirma sessões automaticamente e mantém o histórico de cada paciente em um só lugar — para você focar no atendimento.</p>
          <HeroCTA lng={params.lng} />
          <p className="hero-note">Sem cartão de crédito. Você configura em menos de um dia.</p>
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
                <div className="mk-stat"><div className="mk-stat-lbl">Hoje</div><div className="mk-stat-val b">6</div></div>
                <div className="mk-stat"><div className="mk-stat-lbl">Confirmados</div><div className="mk-stat-val g">5</div></div>
                <div className="mk-stat"><div className="mk-stat-lbl">Pendentes</div><div className="mk-stat-val y">1</div></div>
              </div>
              <div className="mk-grid">
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Próximos pacientes</div>
                  <div className="mk-row"><span className="mk-row-n">Ricardo Mendes — 09:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Ana Paula Costa — 10:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Marcos Oliveira — 11:00</span><span className="bdg bdg-y">Pendente</span></div>
                </div>
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Protocolos</div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Ricardo — Quiropraxia 3/8</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Ana Paula — Massagem relaxante 5/10</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Marcos — Shiatsu 1/6</span></div>
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
        <p className="stats-note">*Resultados médios observados em clínicas ativas</p>
      </div>

      <section className="sec sec-alt">
        <div className="sec-hd">
          <span className="eyebrow">O problema</span>
          <h2 className="sec-title">Protocolo incompleto, paciente <span className="a1">sumido</span>.<br/>E a agenda no caos.</h2>
        </div>
        <div className="feat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', maxWidth: '900px', margin: '0 auto' }}>
          <div className="feat-card">
            <div className="feat-icon">😤</div>
            <h3>Paciente some no meio do tratamento</h3>
            <p>Agenda via WhatsApp, faz uma sessão, desaparece por três semanas e volta reclamando que a dor voltou — sem ter completado o protocolo que você recomendou.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📱</div>
            <h3>WhatsApp pessoal virou agenda</h3>
            <p>Confirmação misturada com cobrança, cobrança com desculpa. No fim do dia, você não sabe quantas sessões fez, quem deve, quem cancelou e quem simplesmente sumiu.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🧠</div>
            <h3>Histórico depende da memória</h3>
            <p>Sem registro organizado, você não lembra em qual sessão o paciente parou, o que foi feito e o que precisa ser retomado. A fidelização depende só da sua memória — e da dele.</p>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      <section className="sec" id="solucao">
        <div className="sec-hd">
          <span className="eyebrow">A solução</span>
          <h2 className="sec-title">Tudo que você precisa para organizar<br/><span className="a2">seu consultório</span></h2>
          <p className="sec-sub">O Aseno foi pensado para quem trabalha com sessões recorrentes e protocolos de tratamento.</p>
        </div>
        <div className="feat-grid">
          <div className="feat-card">
            <div className="feat-icon">📅</div>
            <h3>Agenda ilimitada, separada do seu WhatsApp</h3>
            <p>Cada profissional tem sua própria agenda digital. Sem misturar atendimentos com conversas. Pacientes agendam online pelo link do consultório, a qualquer hora.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">💬</div>
            <h3>Confirmações automáticas por WhatsApp</h3>
            <p>Lembretes 48h, 24h e 2h antes da sessão. No plano Profissional, a IA entende as respostas do paciente e lida com confirmações e reagendamentos sozinha.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔄</div>
            <h3>Sessões recorrentes com acompanhamento real</h3>
            <p>Configure protocolos com múltiplas sessões e saiba exatamente onde cada paciente está no tratamento. Ficha e histórico organizados por paciente.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">💳</div>
            <h3>Pagamentos via PIX e cartão</h3>
            <p>O paciente paga online na hora do agendamento ou depois da sessão. O dashboard financeiro mostra entradas, inadimplência e sessões realizadas.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🌐</div>
            <h3>Landing page pública do consultório</h3>
            <p>Se você não tem site, o Aseno cria uma página profissional com seus serviços, link de agendamento e informações de contato. Pronto para a bio do Instagram.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📋</div>
            <h3>Ficha clínica acessível antes do atendimento</h3>
            <p>Histórico completo do paciente, sessões anteriores e evolução do protocolo — tudo acessível antes de cada atendimento, sem depender da memória.</p>
          </div>
        </div>
      </section>

      <section className="sec sec-alt" id="beneficios">
        <div className="demo-inner">
          <div className="demo-text">
            <span className="eyebrow" style={{ display: 'block' }}>Por que o Aseno</span>
            <h2 className="sec-title" style={{ textAlign: 'left' }}>3 motivos para usar<br/>o <span className="a1">Aseno</span> no seu consultório</h2>
            <div className="checklist">
              <div className="chk"><div className="chk-ic">🗓️</div><span><strong>Agenda sem caos</strong> — Seus horários organizados em um único lugar, com agendamento online 24/7 e confirmações automáticas pelo WhatsApp.</span></div>
              <div className="chk"><div className="chk-ic">📋</div><span><strong>Histórico que acompanha o tratamento</strong> — Ficha clínica e sessões anteriores acessíveis antes de cada atendimento, para retomar o protocolo sem depender da memória.</span></div>
              <div className="chk"><div className="chk-ic">💳</div><span><strong>Cobranças sem desconforto</strong> — Pagamentos por PIX ou cartão integrados ao sistema, com controle financeiro em tempo real.</span></div>
            </div>
          </div>
          <div>
            <div className="phone-wrap">
              <div className="phone-hd">
                <div className="phone-av">💬</div>
                <div><div className="phone-nm">Consultório Massoterapia</div><div className="phone-st">● Online</div></div>
              </div>
              <div className="msgs">
                <div className="msg msg-in">Olá Ricardo! Lembrete: sua sessão de quiropraxia é amanhã às 14h (sessão 3 de 8). Confirma sua presença?<div className="msg-time">08:00</div></div>
                <div className="msg msg-out">Confirmo! Já estou sentindo melhora nas costas<div className="msg-time">08:15</div></div>
                <div className="msg msg-in">Sua presença está confirmada. Até amanhã!<div className="msg-time">08:15</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec testi-sec">
        <div className="sec-hd">
          <span className="eyebrow">Depoimentos</span>
          <h2 className="sec-title">Quem usa, <span className="a1">recomenda</span></h2>
          <p className="sec-sub">Profissionais de massoterapia e quiropraxia que transformaram sua gestão com o Aseno.</p>
        </div>
        <div className="testi-grid">
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Antes eu perdia pacientes no meio do protocolo e nem percebia. Agora vejo no painel quem parou e consigo retomar o contato a tempo.</p><div className="testi-auth">Espaço Corpo & Equilíbrio</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">A confirmação automática pelo WhatsApp reduziu muito as faltas. Meus pacientes confirmam sem eu precisar mandar mensagem.</p><div className="testi-auth">Quiro Vida Clínica</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">O agendamento online mudou tudo. Meus pacientes agendam pela bio do Instagram e eu só recebo a notificação. Muito mais prático.</p><div className="testi-auth">Studio Massoterapia Integral</div></div>
        </div>
      </section>

      <PricingSection lng={params.lng} />

      <section className="sec" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
        <div className="sec-hd" style={{ marginBottom: '2.5rem' }}>
          <span className="eyebrow">Dúvidas</span>
          <h2 className="sec-title">Perguntas <span className="a2">frequentes</span></h2>
        </div>
        <div className="faq-grid">
          <details className="faq-item"><summary>O Aseno funciona para massoterapeuta autônomo, ou só para clínicas?</summary><p>Funciona para os dois. O plano Básico atende até 5 profissionais e já inclui agenda, confirmações automáticas por WhatsApp e ficha de paciente. Se você trabalha sozinho, é mais do que suficiente para começar.</p></details>
          <details className="faq-item"><summary>Preciso ter site para usar o agendamento online?</summary><p>Não. O Aseno gera uma landing page pública do seu consultório com link direto para agendamento. Você coloca esse link na bio do Instagram e pronto — o paciente agenda sem precisar te chamar no WhatsApp.</p></details>
          <details className="faq-item"><summary>Meus pacientes antigos precisam baixar algum aplicativo?</summary><p>Não. O paciente acessa o Portal do Paciente pelo navegador, sem instalar nada. As confirmações chegam por WhatsApp, como já estão acostumados.</p></details>
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
