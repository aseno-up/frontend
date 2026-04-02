import type { Metadata } from 'next'
import { HeroCTA, NavCTA, PricingSection, CtaSection } from '../landing-client'
import { LandingFooter } from '../landing-footer'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Confirmação de Consulta por WhatsApp | Aseno',
  description: 'Confirme consultas automaticamente pelo WhatsApp. Reduza faltas em até 50% sem ligar para cada paciente. Teste grátis por 14 dias.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

export default async function ConfirmacaoWhatsAppLandingPage(props: PageProps) {
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
          <div className="hero-badge"><div className="hero-badge-dot"></div>Confirmação automática de consultas</div>
          <h1 className="hero-title">Pare de ligar para confirmar consulta. O <span className="a2">WhatsApp</span> faz isso por <span className="a1">você</span></h1>
          <p className="hero-sub">O Aseno envia lembretes automáticos pelo WhatsApp, entende a resposta do paciente e atualiza sua agenda sozinho — sem sua equipe precisar tocar no telefone.</p>
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
                <div className="mk-stat"><div className="mk-stat-lbl">Hoje</div><div className="mk-stat-val b">14</div></div>
                <div className="mk-stat"><div className="mk-stat-lbl">Confirmados</div><div className="mk-stat-val g">12</div></div>
                <div className="mk-stat"><div className="mk-stat-lbl">Pendentes</div><div className="mk-stat-val y">2</div></div>
              </div>
              <div className="mk-grid">
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Próximos pacientes</div>
                  <div className="mk-row"><span className="mk-row-n">Ana Costa — 09:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Lucas Mendes — 10:30</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Júlia Santos — 11:00</span><span className="bdg bdg-y">Pendente</span></div>
                </div>
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Confirmações hoje</div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Ana — Confirmou via WhatsApp</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Lucas — Confirmou via WhatsApp</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Júlia — Aguardando resposta</span></div>
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
          <h2 className="sec-title">Confirmar consulta no <span className="a1">manual</span> não escala</h2>
        </div>
        <div className="feat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', maxWidth: '900px', margin: '0 auto' }}>
          <div className="feat-card">
            <div className="feat-icon">📞</div>
            <h3>Sua equipe perde horas ligando</h3>
            <p>Ligar para cada paciente um dia antes consome tempo da recepcionista que deveria estar atendendo quem está na clínica. Com 15, 20 consultas por dia, é inviável.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">👻</div>
            <h3>Paciente não atende e falta</h3>
            <p>Você liga, não atende. Manda mensagem, não responde. No dia, a cadeira fica vazia. O horário se perdeu — e a receita também.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🕳️</div>
            <h3>Agenda com buracos que ninguém preenche</h3>
            <p>Quando o paciente avisa que não vai em cima da hora, não dá tempo de encaixar ninguém. O horário vira prejuízo.</p>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      <section className="sec" id="solucao">
        <div className="sec-hd">
          <span className="eyebrow">A solução</span>
          <h2 className="sec-title">Confirmação automática que<br/><span className="a2">funciona de verdade</span></h2>
          <p className="sec-sub">O Aseno cuida de toda a comunicação com o paciente antes da consulta.</p>
        </div>
        <div className="feat-grid">
          <div className="feat-card">
            <div className="feat-icon">💬</div>
            <h3>3 lembretes automáticos pelo WhatsApp</h3>
            <p>O sistema envia lembretes 48h, 24h e 2h antes de cada consulta. O paciente recebe no WhatsApp — onde ele realmente vê e responde.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🤖</div>
            <h3>IA que entende a resposta do paciente</h3>
            <p>O paciente responde &quot;vou sim&quot;, &quot;não consigo ir&quot; ou &quot;posso trocar pra quinta?&quot; — e a IA entende e atualiza o status na agenda automaticamente.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">✅</div>
            <h3>WhatsApp Oficial — sem risco de ban</h3>
            <p>No plano Profissional, as mensagens são enviadas pela API oficial da Meta. Seu número não corre risco de bloqueio, diferente de soluções não autorizadas.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">⏰</div>
            <h3>Lista de espera automática</h3>
            <p>Paciente cancelou? O sistema avisa automaticamente quem está na lista de espera. O horário se preenche sozinho, sem você precisar ligar.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🚨</div>
            <h3>Detector de risco de faltas</h3>
            <p>Identifica pacientes com histórico de ausência e te avisa antes. Você age preventivamente — e a sala não fica vazia.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📊</div>
            <h3>Relatórios de prejuízo por faltas</h3>
            <p>Veja quanto dinheiro sua clínica está perdendo com faltas e cancelamentos. Dados reais para tomar decisões melhores.</p>
          </div>
        </div>
      </section>

      <section className="sec sec-alt" id="beneficios">
        <div className="demo-inner">
          <div className="demo-text">
            <span className="eyebrow" style={{ display: 'block' }}>Por que o Aseno</span>
            <h2 className="sec-title" style={{ textAlign: 'left' }}>3 motivos para automatizar<br/>suas <span className="a1">confirmações</span></h2>
            <div className="checklist">
              <div className="chk"><div className="chk-ic">⏱️</div><span><strong>Sua equipe para de ligar</strong> — Lembretes automáticos no WhatsApp substituem as ligações manuais. Sua recepcionista foca no atendimento.</span></div>
              <div className="chk"><div className="chk-ic">📉</div><span><strong>Menos faltas, mais receita</strong> — Pacientes confirmados aparecem. Quem não pode ir avisa a tempo, e o horário vai pra lista de espera.</span></div>
              <div className="chk"><div className="chk-ic">🔒</div><span><strong>WhatsApp sem risco</strong> — API oficial da Meta. Sem banimento, sem número pessoal exposto, sem surpresas.</span></div>
            </div>
          </div>
          <div>
            <div className="phone-wrap">
              <div className="phone-hd">
                <div className="phone-av">💬</div>
                <div><div className="phone-nm">Sua Clínica</div><div className="phone-st">● Online</div></div>
              </div>
              <div className="msgs">
                <div className="msg msg-in">Olá Ana! Lembrete: sua consulta é amanhã às 14h. Confirma sua presença?<div className="msg-time">08:00</div></div>
                <div className="msg msg-out">Confirmo! Vou estar lá no horário<div className="msg-time">08:05</div></div>
                <div className="msg msg-in">Perfeito! Sua presença está confirmada. Até amanhã!<div className="msg-time">08:05</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec testi-sec">
        <div className="sec-hd">
          <span className="eyebrow">Depoimentos</span>
          <h2 className="sec-title">Quem usa, <span className="a1">recomenda</span></h2>
          <p className="sec-sub">Clínicas que reduziram faltas com confirmação automática do Aseno.</p>
        </div>
        <div className="testi-grid">
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Nossas faltas caíram pela metade no primeiro mês. A confirmação automática pelo WhatsApp é o que mais fez diferença.</p><div className="testi-auth">Clínica Vitalitá</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Nossa recepcionista economiza horas por dia. O Aseno faz o trabalho pesado de confirmar e reagendar sozinho.</p><div className="testi-auth">Clínica Bem Estar</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">A lista de espera automática é fantástica. Quando um paciente cancela, o sistema preenche a vaga rápido.</p><div className="testi-auth">Instituto Mente Sã</div></div>
        </div>
      </section>

      <PricingSection lng={params.lng} />

      <section className="sec" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
        <div className="sec-hd" style={{ marginBottom: '2.5rem' }}>
          <span className="eyebrow">Dúvidas</span>
          <h2 className="sec-title">Perguntas <span className="a2">frequentes</span></h2>
        </div>
        <div className="faq-grid">
          <details className="faq-item"><summary>Como funciona a confirmação automática pelo WhatsApp?</summary><p>O Aseno envia lembretes automáticos 48h, 24h e 2h antes de cada consulta. O paciente responde direto no WhatsApp e o sistema atualiza o status na agenda. No plano Profissional, a IA entende respostas em linguagem natural — o paciente não precisa digitar &quot;1&quot; ou &quot;2&quot;.</p></details>
          <details className="faq-item"><summary>Preciso trocar meu número de WhatsApp?</summary><p>Não. No plano Profissional, você conecta um número dedicado com WhatsApp Oficial (API da Meta). Seu número pessoal fica separado e sem risco de bloqueio.</p></details>
          <details className="faq-item"><summary>E se o paciente não responder a confirmação?</summary><p>O paciente recebe até 3 lembretes em horários diferentes. Se não responder, o status fica como &quot;pendente&quot; na agenda. O Detector de Risco de Faltas identifica esses padrões e te avisa para agir antes.</p></details>
          <details className="faq-item"><summary>Funciona para qualquer especialidade?</summary><p>Sim. O Aseno foi feito para clínicas com sessões recorrentes — estética, fisioterapia, psicologia, pilates, nutrição, massoterapia e qualquer área que agende consultas.</p></details>
          <details className="faq-item"><summary>Preciso instalar algo?</summary><p>Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.</p></details>
          <details className="faq-item"><summary>Preciso de cartão para testar?</summary><p>Não. 14 dias com acesso completo, sem cartão de crédito.</p></details>
        </div>
      </section>

      <CtaSection lng={params.lng} />

      <LandingFooter />
    </div>
  )
}
