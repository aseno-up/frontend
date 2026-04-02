import type { Metadata } from 'next'
import { HeroCTA, NavCTA, PricingSection, CtaSection } from './landing-client'
import { LandingFooter } from './landing-footer'
import './landing.css'

export const metadata: Metadata = {
  title: 'Aseno — Sistema de Agendamento Inteligente para Clínicas',
  description: 'Reduza faltas na sua clínica com confirmações automáticas no WhatsApp. Agenda online, sessões recorrentes, teleconsulta e pagamentos integrados.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

export default async function LandingPage(props: PageProps) {
  const params = await props.params

  return (
    <div className="landing-body">
      <nav className="landing-nav">
        <a href="#" className="nav-logo">aseno<div className="nav-logo-dot"></div></a>
        <ul className="nav-links">
          <li><a href="#recursos">Recursos</a></li>
          <li><a href="#como-funciona">Como Funciona</a></li>
          <li><a href="#precos">Planos</a></li>
        </ul>
        <NavCTA lng={params.lng} />
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge"><div className="hero-badge-dot"></div>Para profissionais e clínicas que agendam sessões</div>
          <h1 className="hero-title">Reduza <span className="a1">faltas</span> e pare de confirmar consultas no <span className="a2">manual</span></h1>
          <p className="hero-sub">Agenda simples, sessões recorrentes e confirmações automáticas no WhatsApp que atualizam o status sozinhas — sua equipe foca no atendimento.</p>
          <HeroCTA lng={params.lng} />
          <p className="hero-note">Sem cartão de crédito. Ativação imediata.</p>
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
                  <div className="mk-panel-ttl">Próximas pacientes</div>
                  <div className="mk-row"><span className="mk-row-n">Maria Silva — 09:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Juliana Costa — 09:30</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Ana Lima — 10:00</span><span className="bdg bdg-y">Pendente</span></div>
                </div>
                <div className="mk-panel">
                  <div className="mk-panel-ttl">WhatsApp</div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Lembrete enviado para Maria</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Juliana confirmou pre...</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Ana pediu reagendamento</span></div>
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
          <div className="stat-item"><div className="stat-num">24/7</div><div className="stat-lbl">Disponibilidade</div></div>
        </div>
        <p className="stats-note">*Resultados médios observados em clínicas ativas</p>
      </div>

      <section className="sec sec-alt" id="recursos">
        <div className="sec-hd">
          <span className="eyebrow">Recursos</span>
          <h2 className="sec-title">Tudo que sua clínica precisa<br/><span className="a1">em um só lugar</span></h2>
          <p className="sec-sub">Interface que sua equipe aprende a usar em minutos, não em semanas.</p>
        </div>
        <div className="feat-grid">
          <div className="feat-card"><div className="feat-icon">📅</div><h3>Agenda Online</h3><p>Visão diária, semanal e por profissional. Gerencie todos os agendamentos em uma interface intuitiva e fluida.</p></div>
          <div className="feat-card"><div className="feat-icon">💬</div><h3>WhatsApp Integrado</h3><p>Confirmações e lembretes automáticos. O paciente confirma, cancela ou reagenda sem ligar para a clínica.</p></div>
          <div className="feat-card"><div className="feat-icon">🔗</div><h3>Agendamento Público</h3><p>Landing page da sua clínica com perfil, avaliações e agendamento online. O paciente agenda sozinho, 24/7.</p></div>
          <div className="feat-card"><div className="feat-icon">👤</div><h3>Portal do Paciente</h3><p>Seu paciente cria conta, visualiza e cancela agendamentos — tudo pelo portal, sem ligar para a clínica.</p></div>
          <div className="feat-card"><div className="feat-icon">🎥</div><h3>Teleconsulta</h3><p>Link de videochamada gerado automaticamente via Google Meet. Paciente acessa pelo portal ou e-mail.</p></div>
          <div className="feat-card"><div className="feat-icon">🔄</div><h3>Sessões Recorrentes</h3><p>Planos com várias sessões de uma vez. Ideal para tratamentos de fisioterapia, drenagem e protocolos.</p></div>
          <div className="feat-card"><div className="feat-icon">📊</div><h3>Relatórios</h3><p>Presença, faturamento e métricas de faltas. Identifique horários de risco e tome decisões baseadas em dados.</p></div>
          <div className="feat-card"><div className="feat-icon">👥</div><h3>Controle de Acesso</h3><p>Perfis por função: administrador, recepção e profissional. Cada usuário acessa somente as informações que precisa.</p></div>
          <div className="feat-card"><div className="feat-icon">📋</div><h3>Ficha do Paciente</h3><p>Histórico completo de atendimentos, procedimento executado, região tratada e evolução clínica detalhada.</p></div>
          <div className="feat-card"><div className="feat-icon">🗓️</div><h3>Google Calendar</h3><p>Sincronização bidirecional. Compromissos pessoais bloqueiam a agenda automaticamente.</p></div>
          <div className="feat-card"><div className="feat-icon">⏰</div><h3>Lista de Espera</h3><p>Cancelou? O sistema notifica quem está aguardando e preenche a vaga automaticamente.</p></div>
          <div className="feat-card"><div className="feat-icon">🔒</div><h3>Segurança e Backup</h3><p>Dados protegidos, backup diário automático e acesso seguro com autenticação por perfil.</p></div>
          <div className="feat-card"><div className="feat-icon">💳</div><h3>Pagamentos Online</h3><p>Receba via PIX e Cartão de Crédito direto na conta da clínica. O paciente paga ao agendar — sem intermediários.</p></div>
        </div>
      </section>

      <div className="divider"></div>

      <section className="sec" id="como-funciona">
        <div className="sec-hd">
          <span className="eyebrow">Como Funciona</span>
          <h2 className="sec-title">Comece a usar em<br/><span className="a2">menos de 5 minutos</span></h2>
          <p className="sec-sub">Quatro passos para transformar a gestão da sua clínica.</p>
        </div>
        <div className="how-grid">
          <div className="how-step"><div className="how-num">1</div><h3>Agende a consulta</h3><p>Crie atendimentos únicos ou planos com várias sessões de forma rápida e simples no painel.</p></div>
          <div className="how-step"><div className="how-num">2</div><h3>WhatsApp automático</h3><p>O paciente recebe o lembrete via WhatsApp e confirma ou reagenda com poucos cliques, sem telefonar.</p></div>
          <div className="how-step"><div className="how-num">3</div><h3>Status atualizado</h3><p>Confirmado, cancelado ou reagendado — tudo atualizado na agenda sem trabalho manual.</p></div>
          <div className="how-step"><div className="how-num">4</div><h3>Agenda sincronizada</h3><p>Google Calendar integrado. Horários pessoais e profissionais sempre em sincronia e harmonia.</p></div>
        </div>
      </section>

      <section className="sec sec-alt">
        <div className="demo-inner">
          <div className="demo-text">
            <span className="eyebrow" style={{ display: 'block' }}>Automação inteligente</span>
            <h2 className="sec-title" style={{ textAlign: 'left' }}>A parte chata,<br/>o <span className="a1">Aseno resolve</span></h2>
            <p className="sec-sub" style={{ textAlign: 'left', marginTop: '.85rem' }}>A IA entende a resposta do paciente e atualiza o status da consulta automaticamente. Sem intervenção manual da sua equipe.</p>
            <div className="checklist">
              <div className="chk"><div className="chk-ic">✓</div><span>Confirmação automática via WhatsApp</span></div>
              <div className="chk"><div className="chk-ic">✓</div><span>Reagendamento em 1 clique pelo paciente</span></div>
              <div className="chk"><div className="chk-ic">✓</div><span>Mensagem personalizada por procedimento</span></div>
              <div className="chk"><div className="chk-ic">✓</div><span>Envio programado horas antes da consulta</span></div>
              <div className="chk"><div className="chk-ic">✓</div><span>Suporte técnico em português</span></div>
            </div>
          </div>
          <div>
            <div className="phone-wrap">
              <div className="phone-hd">
                <div className="phone-av">💬</div>
                <div><div className="phone-nm">Aseno Clínica</div><div className="phone-st">● Online</div></div>
              </div>
              <div className="msgs">
                <div className="msg msg-in">Olá Maria! Lembrete: sua consulta é amanhã às 14h. Confirma sua presença?<div className="msg-time">08:00</div></div>
                <div className="msg msg-out">Vou levar minha filha na escola e chego às 14h05 😊<div className="msg-time">08:05</div></div>
                <div className="msg msg-in">Perfeito! Sem problemas. Sua consulta está confirmada. Até amanhã!<div className="msg-time">08:05</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <span className="eyebrow">Para quem é</span>
          <h2 className="sec-title">Feito para <span className="a2">quem cuida</span></h2>
          <p className="sec-sub">Se você agenda sessões e perde dinheiro com faltas, o Aseno foi feito pra você.</p>
        </div>
        <div className="for-grid">
          <div className="for-card"><div className="for-icon">✨</div><h3>Estética</h3><p>Procedimento, região tratada e sessões recorrentes organizados. Do facial ao corporal.</p></div>
          <div className="for-card"><div className="for-icon">🦴</div><h3>Fisioterapia</h3><p>Evolução clínica, contador de sessões e acompanhamento de planos de tratamento.</p></div>
          <div className="for-card"><div className="for-icon">🧠</div><h3>Psicologia</h3><p>Sessões semanais recorrentes, ficha do paciente e lembretes automáticos sem esforço.</p></div>
          <div className="for-card"><div className="for-icon">🧘</div><h3>Pilates e Yoga</h3><p>Planos de sessões, controle de frequência e agenda por instrutor.</p></div>
          <div className="for-card"><div className="for-icon">🥗</div><h3>Nutrição</h3><p>Retornos agendados automaticamente e lembretes que reduzem faltas nas consultas.</p></div>
          <div className="for-card"><div className="for-icon">💆</div><h3>Massoterapia e Quiropraxia</h3><p>Sessões avulsas ou pacotes. O paciente agenda pelo link e recebe lembrete no WhatsApp.</p></div>
        </div>
      </section>

      <section className="sec testi-sec">
        <div className="sec-hd">
          <span className="eyebrow">Depoimentos</span>
          <h2 className="sec-title">Quem usa, <span className="a1">recomenda</span></h2>
          <p className="sec-sub">Clínicas que transformaram sua gestão diária com o Aseno.</p>
        </div>
        <div className="testi-grid">
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Desde que implementamos, nossas faltas caíram drasticamente. A confirmação automática pelo WhatsApp é incrível.</p><div className="testi-auth">Clínica Vitalitá</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Nossa recepcionista economiza horas por dia. O Aseno faz o trabalho pesado de confirmar e reagendar sozinho.</p><div className="testi-auth">Clínica Bem Estar</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">A lista de espera automática é fantástica. Quando uma paciente cancela, o sistema preenche a vaga rápido.</p><div className="testi-auth">Instituto Mente Sã</div></div>
        </div>
      </section>

      <PricingSection lng={params.lng} />

      <section className="sec" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
        <div className="sec-hd" style={{ marginBottom: '2.5rem' }}>
          <span className="eyebrow">Dúvidas</span>
          <h2 className="sec-title">Perguntas <span className="a2">frequentes</span></h2>
        </div>
        <div className="faq-grid">
          <details className="faq-item"><summary>Preciso instalar algo?</summary><p>Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.</p></details>
          <details className="faq-item"><summary>Funciona no celular?</summary><p>Sim. Interface totalmente responsiva em qualquer smartphone, tablet ou computador.</p></details>
          <details className="faq-item"><summary>Preciso de cartão para testar?</summary><p>Não. 14 dias com acesso completo, sem cartão de crédito.</p></details>
          <details className="faq-item"><summary>O preço é por profissional?</summary><p>Não. O preço é por clínica. No plano Profissional, até 15 profissionais pagam o mesmo valor.</p></details>
          <details className="faq-item"><summary>Meu paciente pode agendar sozinho?</summary><p>Sim. Você recebe um link exclusivo para colocar no Instagram, site ou onde quiser. O paciente agenda 24/7.</p></details>
          <details className="faq-item"><summary>O WhatsApp da clínica pode ser banido?</summary><p>Com o WhatsApp Oficial (plano Profissional), não. É a API autorizada pela Meta, sem risco de banimento.</p></details>
          <details className="faq-item"><summary>Como funciona o pagamento online?</summary><p>No plano Profissional, sua clínica recebe pagamentos via PIX e Cartão de Crédito diretamente na sua conta. O paciente paga ao agendar e o dinheiro cai direto na conta da clínica, sem intermediários.</p></details>
        </div>
      </section>

      <CtaSection lng={params.lng} />

      <LandingFooter />
    </div>
  )
}