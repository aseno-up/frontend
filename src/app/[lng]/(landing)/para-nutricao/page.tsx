import type { Metadata } from 'next'
import { HeroCTA, NavCTA, PricingSection, CtaSection } from '../landing-client'
import { LandingFooter } from '../landing-footer'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Software de Gestão para Nutricionistas | Aseno',
  description: 'Controle agenda, retornos, teleconsultas e cobranças da sua clínica de nutrição em um único lugar. Sem planilha, sem WhatsApp manual.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

export default async function NutricaoLandingPage(props: PageProps) {
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
          <div className="hero-badge"><div className="hero-badge-dot"></div>Para nutricionistas e clínicas de nutrição</div>
          <h1 className="hero-title">O paciente saiu da consulta. Ele vai voltar para o <span className="a1">retorno</span>?</h1>
          <p className="hero-sub">Com o Aseno, o próprio paciente agenda o retorno — e você recebe confirmação automática, pagamento garantido e sem depender de lembrança manual.</p>
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
                  <div className="mk-row"><span className="mk-row-n">Juliana Costa — 08:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Rafael Mendes — 09:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Mariana Souza — 10:00</span><span className="bdg bdg-y">Pendente</span></div>
                </div>
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Retornos</div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Juliana — Retorno 30 dias</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Rafael — Retorno 60 dias</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Mariana — 1ª Consulta</span></div>
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
          <h2 className="sec-title">O retorno é onde a maioria das clínicas de nutrição <span className="a1">perde paciente</span>.</h2>
        </div>
        <div className="feat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', maxWidth: '900px', margin: '0 auto' }}>
          <div className="feat-card">
            <div className="feat-icon">😤</div>
            <h3>Paciente some depois da primeira consulta</h3>
            <p>Você faz uma consulta completa, monta o plano alimentar, combina o retorno em 30 dias. Mas quando chega a hora de remarcar, ninguém lembra. O paciente não é ruim — o processo é frágil.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📋</div>
            <h3>Agenda presencial e teleconsulta viram caos</h3>
            <p>Segunda tem atendimento presencial, quinta é online, sexta uma paciente pediu para mudar de horário pelo Instagram. Você anota onde consegue, confirma pelo WhatsApp pessoal, e no final do dia não sabe o que ficou combinado.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">💸</div>
            <h3>Cobrança via PIX manual não é processo</h3>
            <p>Manda a chave, aguarda o comprovante, confere, responde. Para cada paciente, toda semana. Sem registro, sem controle de quem pagou, sem relatório. Se a clínica crescer, esse processo quebra.</p>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      <section className="sec" id="solucao">
        <div className="sec-hd">
          <span className="eyebrow">A solução</span>
          <h2 className="sec-title">Tudo que sua clínica de nutrição precisa<br/><span className="a2">em um só lugar</span></h2>
          <p className="sec-sub">O Aseno resolve cada um desses pontos sem que você precise mudar tudo de uma vez.</p>
        </div>
        <div className="feat-grid">
          <div className="feat-card">
            <div className="feat-icon">🔄</div>
            <h3>Retornos que não somem</h3>
            <p>Com sessões recorrentes, o Aseno registra a frequência do ciclo do paciente (30, 60 ou 90 dias) e o próprio paciente recebe o link para agendar o próximo retorno. Sem você precisar lembrar de mandar mensagem.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">💬</div>
            <h3>Confirmações automáticas pelo WhatsApp</h3>
            <p>48 horas, 24 horas e 2 horas antes da consulta, o paciente recebe uma confirmação automática. No plano Profissional, a IA entende as respostas — se o paciente responder &quot;não consigo ir amanhã&quot;, o sistema identifica e alerta.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📹</div>
            <h3>Teleconsulta integrada</h3>
            <p>Atendimentos online acontecem direto pelo Google Meet, com link gerado automaticamente dentro do sistema. Não precisa gerar link manualmente, não precisa copiar e colar no WhatsApp.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">💳</div>
            <h3>Pagamento online sem trabalho manual</h3>
            <p>O paciente paga por PIX ou cartão no momento do agendamento, antes de ocupar o horário. O controle financeiro fica dentro do Aseno — você visualiza o que entrou, o que está pendente e o histórico por paciente.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🚨</div>
            <h3>Detector de risco de faltas</h3>
            <p>O sistema identifica pacientes com padrão de comportamento que antecede falta — como não abrir as confirmações ou remarcar com frequência — e te avisa antes do horário chegar.</p>
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
            <h2 className="sec-title" style={{ textAlign: 'left' }}>3 motivos para usar<br/>o <span className="a1">Aseno</span> no seu consultório</h2>
            <div className="checklist">
              <div className="chk"><div className="chk-ic">📅</div><span><strong>Retorno garantido</strong> — O paciente agenda o próprio retorno pelo link da clínica — sem depender de mensagem manual sua.</span></div>
              <div className="chk"><div className="chk-ic">💬</div><span><strong>Zero confirmação manual</strong> — WhatsApp automático nos momentos certos. Você só entra em contato quando realmente precisa.</span></div>
              <div className="chk"><div className="chk-ic">💳</div><span><strong>Cobrança no ato do agendamento</strong> — PIX e cartão integrados. O horário só é confirmado com o pagamento feito.</span></div>
            </div>
          </div>
          <div>
            <div className="phone-wrap">
              <div className="phone-hd">
                <div className="phone-av">💬</div>
                <div><div className="phone-nm">Consultório Nutrição</div><div className="phone-st">● Online</div></div>
              </div>
              <div className="msgs">
                <div className="msg msg-in">Olá Juliana! Lembrete: seu retorno nutricional é amanhã às 09h. Confirma sua presença?<div className="msg-time">08:00</div></div>
                <div className="msg msg-out">Confirmo! Já estou seguindo o plano direitinho<div className="msg-time">08:15</div></div>
                <div className="msg msg-in">Presença confirmada. Até amanhã!<div className="msg-time">08:15</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec testi-sec">
        <div className="sec-hd">
          <span className="eyebrow">Depoimentos</span>
          <h2 className="sec-title">Quem usa, <span className="a1">recomenda</span></h2>
          <p className="sec-sub">Nutricionistas que transformaram sua gestão com o Aseno.</p>
        </div>
        <div className="testi-grid">
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Meus pacientes agora agendam o retorno sozinhos. Parei de perder retornos de 30 dias e minha taxa de retenção melhorou muito.</p><div className="testi-auth">Clínica NutriVida</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">A confirmação automática pelo WhatsApp é incrível. Antes eu passava horas ligando para confirmar consulta, agora o sistema faz tudo.</p><div className="testi-auth">Consultório Equilíbrio</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">O pagamento online mudou tudo. Paciente paga na hora de agendar e eu não preciso mais ficar cobrando por PIX no WhatsApp.</p><div className="testi-auth">NutriCenter Saúde</div></div>
        </div>
      </section>

      <PricingSection lng={params.lng} />

      <section className="sec" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
        <div className="sec-hd" style={{ marginBottom: '2.5rem' }}>
          <span className="eyebrow">Dúvidas</span>
          <h2 className="sec-title">Perguntas <span className="a2">frequentes</span></h2>
        </div>
        <div className="faq-grid">
          <details className="faq-item"><summary>O Aseno funciona para nutricionista autônoma, sem clínica?</summary><p>Sim. O plano Básico é pensado para até 5 profissionais e já inclui agenda, agendamento online, portal do paciente e confirmações automáticas por WhatsApp. Funciona tanto para quem atende sozinho quanto para equipes pequenas.</p></details>
          <details className="faq-item"><summary>Consigo migrar minha agenda atual para o Aseno?</summary><p>No plano Avançado, a importação de dados do sistema anterior está incluída com suporte da equipe. Para quem está saindo de planilhas ou de outro sistema, o processo é acompanhado.</p></details>
          <details className="faq-item"><summary>Meus pacientes precisam baixar algum aplicativo?</summary><p>Não. O paciente acessa o Portal do Paciente pelo navegador do celular, sem instalar nada. Agenda, confirma e recebe lembretes pelo WhatsApp normalmente.</p></details>
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
