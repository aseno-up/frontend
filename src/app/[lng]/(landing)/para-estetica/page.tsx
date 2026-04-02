import type { Metadata } from 'next'
import { HeroCTA, NavCTA, PricingSection, CtaSection } from '../landing-client'
import { LandingFooter } from '../landing-footer'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Software para Clínicas de Estética | Aseno',
  description: 'Gerencie protocolos, reduza faltas e mantenha seus pacientes voltando. Software de gestão feito para clínicas de estética com sessões recorrentes.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

export default async function EsteticaLandingPage(props: PageProps) {
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
          <div className="hero-badge"><div className="hero-badge-dot"></div>Para clínicas de estética com sessões recorrentes</div>
          <h1 className="hero-title">Sua agenda cheia não adianta nada se o paciente faz uma sessão e <span className="a1">some</span></h1>
          <p className="hero-sub">O Aseno organiza seus protocolos, confirma as sessões automaticamente e mantém o paciente comprometido com o tratamento — sem você precisar correr atrás.</p>
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
                <div className="mk-stat"><div className="mk-stat-lbl">Hoje</div><div className="mk-stat-val b">8</div></div>
                <div className="mk-stat"><div className="mk-stat-lbl">Confirmados</div><div className="mk-stat-val g">7</div></div>
                <div className="mk-stat"><div className="mk-stat-lbl">Pendentes</div><div className="mk-stat-val y">1</div></div>
              </div>
              <div className="mk-grid">
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Próximas pacientes</div>
                  <div className="mk-row"><span className="mk-row-n">Camila Reis — 09:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Fernanda Lopes — 10:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Patrícia Alves — 11:00</span><span className="bdg bdg-y">Pendente</span></div>
                </div>
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Protocolos</div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Camila — Radiofreq. 4/10</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Fernanda — Drenagem 6/8</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Patrícia — Criolipólise 1/5</span></div>
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
          <h2 className="sec-title">O resultado vem com <span className="a1">continuidade</span>.<br/>Mas o paciente some.</h2>
        </div>
        <div className="feat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', maxWidth: '900px', margin: '0 auto' }}>
          <div className="feat-card">
            <div className="feat-icon">😤</div>
            <h3>Paciente abandona o protocolo</h3>
            <p>Faz a primeira sessão, gosta, some por duas semanas e quando volta já perdeu boa parte do progresso — do protocolo e da sua receita.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📋</div>
            <h3>Controle de sessões no caos</h3>
            <p>Planilha, caderno, post-it, memória. Quando a clínica cresce, esse controle quebra. Você fica sem saber quem está no meio do protocolo e quem abandonou.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🕳️</div>
            <h3>Agenda com buracos</h3>
            <p>Dias com sala cheia e outros com buracos porque dois ou três pacientes confirmaram e não apareceram. Você não tem tempo de ligar para cada um.</p>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      <section className="sec" id="solucao">
        <div className="sec-hd">
          <span className="eyebrow">A solução</span>
          <h2 className="sec-title">Tudo que sua clínica de estética precisa<br/><span className="a2">em um só lugar</span></h2>
          <p className="sec-sub">O Aseno foi pensado para clínicas que trabalham com protocolos e sessões recorrentes.</p>
        </div>
        <div className="feat-grid">
          <div className="feat-card">
            <div className="feat-icon">🔄</div>
            <h3>Sessões recorrentes organizadas por protocolo</h3>
            <p>Configure o protocolo do paciente uma vez — número de sessões, frequência, procedimento — e o sistema acompanha o andamento automaticamente. Veja quem está em dia e quem parou no meio.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">💬</div>
            <h3>Confirmação automática via WhatsApp</h3>
            <p>Lembretes automáticos 48h, 24h e 2h antes de cada sessão. No plano Profissional, o WhatsApp é oficial (sem risco de ban) e a IA entende as respostas do paciente.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🚨</div>
            <h3>Detector de risco de faltas</h3>
            <p>Identifica pacientes com padrão de ausência antes de o horário ser perdido. Você age antes — e a sala não fica vazia.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">⏰</div>
            <h3>Lista de espera automática</h3>
            <p>Teve cancelamento de última hora? O sistema avisa automaticamente quem está na lista de espera. O horário se preenche sozinho.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">💳</div>
            <h3>Pagamentos na hora, sem constrangimento</h3>
            <p>PIX e cartão direto pelo portal do paciente. Você recebe antes ou no dia da sessão, sem precisar cobrar pessoalmente.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔗</div>
            <h3>Portal do paciente e agendamento 24/7</h3>
            <p>Seu paciente agenda no horário que prefere — via link na bio, sem depender de você estar disponível. Menos mensagem no WhatsApp pessoal.</p>
          </div>
        </div>
      </section>

      <section className="sec sec-alt" id="beneficios">
        <div className="demo-inner">
          <div className="demo-text">
            <span className="eyebrow" style={{ display: 'block' }}>Por que o Aseno</span>
            <h2 className="sec-title" style={{ textAlign: 'left' }}>3 motivos para usar<br/>o <span className="a1">Aseno</span> na sua clínica</h2>
            <div className="checklist">
              <div className="chk"><div className="chk-ic">🗂️</div><span><strong>Controle de protocolo real</strong> — Veja exatamente em qual sessão cada paciente está, por procedimento, sem planilha.</span></div>
              <div className="chk"><div className="chk-ic">📲</div><span><strong>Zero falta sem esforço</strong> — Confirmações automáticas via WhatsApp cuidam da presença para você.</span></div>
              <div className="chk"><div className="chk-ic">💳</div><span><strong>Receba antes de atender</strong> — Pagamento online por PIX ou cartão direto no agendamento, sem cobrar na hora.</span></div>
            </div>
          </div>
          <div>
            <div className="phone-wrap">
              <div className="phone-hd">
                <div className="phone-av">💬</div>
                <div><div className="phone-nm">Clínica Estética</div><div className="phone-st">● Online</div></div>
              </div>
              <div className="msgs">
                <div className="msg msg-in">Olá Camila! Lembrete: sua sessão de radiofrequência é amanhã às 14h (sessão 4 de 10). Confirma sua presença?<div className="msg-time">08:00</div></div>
                <div className="msg msg-out">Confirmo sim! Estou adorando os resultados<div className="msg-time">08:12</div></div>
                <div className="msg msg-in">Sua presença está confirmada. Até amanhã!<div className="msg-time">08:12</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec testi-sec">
        <div className="sec-hd">
          <span className="eyebrow">Depoimentos</span>
          <h2 className="sec-title">Quem usa, <span className="a1">recomenda</span></h2>
          <p className="sec-sub">Clínicas de estética que transformaram sua gestão com o Aseno.</p>
        </div>
        <div className="testi-grid">
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Desde que implementamos, nossas faltas caíram drasticamente. A confirmação automática pelo WhatsApp é incrível.</p><div className="testi-auth">Clínica Vitalitá</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">O controle de protocolos mudou tudo. Antes eu perdia paciente no meio do tratamento e nem sabia. Agora vejo tudo no painel.</p><div className="testi-auth">Studio Beleza & Saúde</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">A lista de espera automática é fantástica. Quando uma paciente cancela, o sistema preenche a vaga rápido.</p><div className="testi-auth">Clínica Derma Corpo</div></div>
        </div>
      </section>

      <PricingSection lng={params.lng} />

      <section className="sec" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
        <div className="sec-hd" style={{ marginBottom: '2.5rem' }}>
          <span className="eyebrow">Dúvidas</span>
          <h2 className="sec-title">Perguntas <span className="a2">frequentes</span></h2>
        </div>
        <div className="faq-grid">
          <details className="faq-item"><summary>O Aseno funciona para clínicas que têm vários tipos de protocolo ao mesmo tempo?</summary><p>Sim. Você cadastra quantos protocolos quiser — drenagem linfática, radiofrequência, criolipólise, skincare — e acompanha cada paciente de forma independente. Um paciente pode estar em dois protocolos ao mesmo tempo, e o sistema mantém o controle separado.</p></details>
          <details className="faq-item"><summary>Preciso trocar meu número de WhatsApp para usar as confirmações automáticas?</summary><p>Não. No plano Profissional, você conecta um número dedicado com WhatsApp Oficial. Seu número pessoal fica separado e sem risco de bloqueio pelo Meta.</p></details>
          <details className="faq-item"><summary>Quanto custa para uma clínica com 4 profissionais?</summary><p>O plano Básico cobre até 5 profissionais com agenda ilimitada, agendamento online, portal do paciente e confirmações automáticas. O preço é por clínica, não por profissional — então não muda se você contratar mais alguém dentro do limite do plano.</p></details>
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
