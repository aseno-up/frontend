import type { Metadata } from 'next'
import { HeroCTA, NavCTA, PricingSection, CtaSection } from '../landing-client'
import { LandingFooter } from '../landing-footer'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Software para Psicólogos e Clínicas de Psicologia | Aseno',
  description: 'Gerencie sua agenda, reduza faltas e receba online sem usar seu WhatsApp pessoal. O Aseno foi feito para psicólogos que trabalham com sessões recorrentes.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

export default async function PsicologiaLandingPage(props: PageProps) {
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
          <div className="hero-badge"><div className="hero-badge-dot"></div>Para psicólogos com sessões recorrentes</div>
          <h1 className="hero-title">Sua agenda organizada. Suas sessões confirmadas. Sem depender do seu <span className="a1">WhatsApp pessoal</span></h1>
          <p className="hero-sub">O Aseno cuida da confirmação, do histórico e do pagamento para que você possa focar no atendimento.</p>
          <HeroCTA lng={params.lng} />
          <p className="hero-note">Sem cartão de crédito. Configuração em menos de uma hora.</p>
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
                  <div className="mk-row"><span className="mk-row-n">Mariana Silva — 08:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Lucas Oliveira — 09:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Beatriz Santos — 10:00</span><span className="bdg bdg-y">Pendente</span></div>
                </div>
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Sessões recorrentes</div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Mariana — Semanal (seg 08h)</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Lucas — Semanal (ter 09h)</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Beatriz — Quinzenal (qua 10h)</span></div>
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
          <h2 className="sec-title">Você reservou o horário. O paciente <span className="a1">não apareceu</span>.<br/>E agora tem 50 minutos sem reposição.</h2>
        </div>
        <div className="feat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', maxWidth: '900px', margin: '0 auto' }}>
          <div className="feat-card">
            <div className="feat-icon">😤</div>
            <h3>Faltas sem aviso prévio</h3>
            <p>O paciente não aparece e você fica com 50 minutos vazios, sem reposição e sem conseguir encaixar outro atendimento. Isso não é exceção — é uma falha no processo.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📱</div>
            <h3>Cobrança pelo WhatsApp pessoal</h3>
            <p>Cobrar pelo WhatsApp pessoal é desconfortável. Lembrar cada paciente manualmente antes da sessão consome tempo fora do consultório e mistura vida pessoal com profissional.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📋</div>
            <h3>Histórico espalhado</h3>
            <p>Quando o histórico está em anotações espalhadas, reconstruir o acompanhamento de um paciente vira um trabalho à parte. Para quem trabalha com sessões semanais, a desorganização pesa duas vezes.</p>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      <section className="sec" id="solucao">
        <div className="sec-hd">
          <span className="eyebrow">A solução</span>
          <h2 className="sec-title">Tudo que seu consultório de psicologia precisa<br/><span className="a2">em um só lugar</span></h2>
          <p className="sec-sub">O Aseno foi pensado para psicólogos que trabalham com sessões recorrentes e acompanhamento de longo prazo.</p>
        </div>
        <div className="feat-grid">
          <div className="feat-card">
            <div className="feat-icon">💬</div>
            <h3>Confirmações automáticas pelo WhatsApp</h3>
            <p>O Aseno envia lembretes automáticos 48h, 24h e 2h antes de cada sessão. O paciente confirma, cancela ou solicita reagendamento direto pelo WhatsApp. Você só vê o resultado na agenda.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔄</div>
            <h3>Sessões recorrentes já configuradas</h3>
            <p>Cadastre o paciente uma vez e defina a recorrência semanal. A agenda se organiza automaticamente — sem precisar remarcar manualmente toda semana.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📋</div>
            <h3>Ficha e histórico centralizado</h3>
            <p>Cada paciente tem um perfil com histórico completo de sessões, anotações e evolução. Tudo em um lugar, acessível quando você precisar.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">💳</div>
            <h3>Pagamento online sem constrangimento</h3>
            <p>Com o plano Profissional, o paciente paga via PIX ou cartão antes da sessão, direto pela plataforma. Nada de cobranças por mensagem ou conversas difíceis sobre valores.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔒</div>
            <h3>WhatsApp Oficial — sem risco de perder seu número</h3>
            <p>O Aseno usa a API oficial do WhatsApp. Seu número pessoal fica fora da operação, sem risco de bloqueio por mensagens automáticas.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📹</div>
            <h3>Teleconsulta via Google Meet</h3>
            <p>Atenda online com link gerado automaticamente para cada sessão. Sem abrir e-mail, sem gerar link manual — tudo dentro da agenda.</p>
          </div>
        </div>
      </section>

      <section className="sec sec-alt" id="beneficios">
        <div className="demo-inner">
          <div className="demo-text">
            <span className="eyebrow" style={{ display: 'block' }}>Por que o Aseno</span>
            <h2 className="sec-title" style={{ textAlign: 'left' }}>3 motivos para usar<br/>o <span className="a1">Aseno</span> no seu consultório</h2>
            <div className="checklist">
              <div className="chk"><div className="chk-ic">🗓️</div><span><strong>Agenda que se cuida sozinha</strong> — Sessões recorrentes configuradas uma vez, confirmações automáticas enviadas sem ação sua.</span></div>
              <div className="chk"><div className="chk-ic">🔒</div><span><strong>Seu número pessoal protegido</strong> — WhatsApp Oficial integrado — mensagens automáticas sem risco de ban no número que você usa com pacientes e família.</span></div>
              <div className="chk"><div className="chk-ic">📋</div><span><strong>Histórico sempre acessível</strong> — Ficha completa de cada paciente em um clique, com evolução, sessões anteriores e anotações organizadas.</span></div>
            </div>
          </div>
          <div>
            <div className="phone-wrap">
              <div className="phone-hd">
                <div className="phone-av">💬</div>
                <div><div className="phone-nm">Consultório Psicologia</div><div className="phone-st">● Online</div></div>
              </div>
              <div className="msgs">
                <div className="msg msg-in">Olá Mariana! Lembrete: sua sessão de psicoterapia é amanhã às 08h. Confirma sua presença?<div className="msg-time">08:00</div></div>
                <div className="msg msg-out">Confirmo! Até amanhã<div className="msg-time">08:15</div></div>
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
          <p className="sec-sub">Psicólogos que transformaram sua gestão com o Aseno.</p>
        </div>
        <div className="testi-grid">
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Desde que comecei a usar, minhas faltas caíram pela metade. A confirmação automática pelo WhatsApp mudou minha rotina.</p><div className="testi-auth">Consultório Psicologia Integrada</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">O histórico centralizado é incrível. Antes eu perdia tempo procurando anotações. Agora tenho tudo em um clique antes de cada sessão.</p><div className="testi-auth">Clínica Mente & Saúde</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Não preciso mais cobrar pelo WhatsApp. O paciente recebe o link de pagamento e paga antes da sessão. Muito mais profissional.</p><div className="testi-auth">Espaço Terapêutico Viver</div></div>
        </div>
      </section>

      <PricingSection lng={params.lng} />

      <section className="sec" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
        <div className="sec-hd" style={{ marginBottom: '2.5rem' }}>
          <span className="eyebrow">Dúvidas</span>
          <h2 className="sec-title">Perguntas <span className="a2">frequentes</span></h2>
        </div>
        <div className="faq-grid">
          <details className="faq-item"><summary>O Aseno funciona para psicólogo autônomo, não só para clínicas?</summary><p>Sim. O plano Básico atende até 5 profissionais e é usado tanto por consultórios individuais quanto por clínicas pequenas. Você tem acesso a agenda, histórico, portal do paciente e confirmações automáticas desde o primeiro plano.</p></details>
          <details className="faq-item"><summary>Preciso migrar todos os meus dados para começar a usar?</summary><p>Não obrigatoriamente. Você pode começar a cadastrar novos pacientes e ir organizando os ativos no seu ritmo. Para quem quer importar dados de outro sistema, essa funcionalidade está disponível no plano Avançado.</p></details>
          <details className="faq-item"><summary>O WhatsApp automático pode banir meu número?</summary><p>No plano Profissional, o Aseno usa a API Oficial do WhatsApp Business, que é a versão homologada pelo próprio WhatsApp para envio de mensagens em volume. Não há risco de bloqueio quando feito por essa via. No plano Básico, as confirmações são enviadas por um número do Aseno — não pelo seu.</p></details>
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
