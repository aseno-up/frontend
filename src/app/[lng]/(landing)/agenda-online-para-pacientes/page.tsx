import type { Metadata } from 'next'
import { HeroCTA, NavCTA, PricingSection, CtaSection } from '../landing-client'
import { LandingFooter } from '../landing-footer'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Agenda Online para Pacientes | Aseno',
  description: 'Seus pacientes agendam sozinhos, 24 horas por dia. Confirmação automática por WhatsApp e menos faltas. Teste grátis por 14 dias.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

export default async function AgendaOnlineLandingPage(props: PageProps) {
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
          <div className="hero-badge"><div className="hero-badge-dot"></div>Agendamento online para clínicas com sessões recorrentes</div>
          <h1 className="hero-title">Seus pacientes ainda ligam para <span className="a1">marcar horário</span>?</h1>
          <p className="hero-sub">Com o Aseno, sua clínica recebe agendamentos 24 horas por dia, confirma automaticamente pelo WhatsApp e reduz faltas — sem sua equipe precisar atender o telefone.</p>
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
                <div className="mk-stat"><div className="mk-stat-lbl">Hoje</div><div className="mk-stat-val b">12</div></div>
                <div className="mk-stat"><div className="mk-stat-lbl">Confirmados</div><div className="mk-stat-val g">11</div></div>
                <div className="mk-stat"><div className="mk-stat-lbl">Pendentes</div><div className="mk-stat-val y">1</div></div>
              </div>
              <div className="mk-grid">
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Próximos pacientes</div>
                  <div className="mk-row"><span className="mk-row-n">Lucas Martins — 09:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Ana Beatriz — 10:30</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Roberto Silva — 14:00</span><span className="bdg bdg-y">Pendente</span></div>
                </div>
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Agendados online</div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Lucas — via portal (ontem, 22h)</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Ana — via link na bio (dom, 08h)</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Roberto — via portal (seg, 19h)</span></div>
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
          <h2 className="sec-title">Sua equipe ainda perde tempo <span className="a1">atendendo telefone</span>.</h2>
        </div>
        <div className="feat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', maxWidth: '900px', margin: '0 auto' }}>
          <div className="feat-card">
            <div className="feat-icon">📞</div>
            <h3>Telefone tocando o dia inteiro</h3>
            <p>Enquanto você atende um paciente, a recepcionista está ao telefone marcando o próximo. Fora do horário comercial, ninguém atende — e o paciente agenda em outro lugar.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🕳️</div>
            <h3>Faltas que ninguém previu</h3>
            <p>O paciente confirmou pelo WhatsApp pessoal, mas não apareceu. Você só descobre quando olha a sala vazia. Nenhuma lista de espera foi acionada.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📋</div>
            <h3>Controle manual que não escala</h3>
            <p>Agenda de papel, planilha, WhatsApp pessoal. Funciona com 5 pacientes por dia, mas quando a clínica cresce, os erros crescem junto — horário duplicado, paciente esquecido, sessão perdida.</p>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      <section className="sec" id="solucao">
        <div className="sec-hd">
          <span className="eyebrow">A solução</span>
          <h2 className="sec-title">Agendamento online que funciona<br/><span className="a2">enquanto você atende</span></h2>
          <p className="sec-sub">Seus pacientes agendam sozinhos, recebem confirmação automática e você foca no que importa.</p>
        </div>
        <div className="feat-grid">
          <div className="feat-card">
            <div className="feat-icon">🌐</div>
            <h3>Portal do paciente 24/7</h3>
            <p>Seu paciente acessa o portal da clínica, escolhe o profissional, o horário e agenda sozinho — a qualquer hora do dia ou da noite, sem depender da recepção.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">💬</div>
            <h3>Confirmação automática via WhatsApp</h3>
            <p>Lembretes automáticos 48h, 24h e 2h antes de cada sessão. No plano Profissional, o WhatsApp é oficial (sem risco de ban) e a IA entende as respostas do paciente.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔗</div>
            <h3>Link na bio que agenda direto</h3>
            <p>Coloque o link de agendamento no Instagram, Google Meu Negócio ou onde quiser. O paciente clica, escolhe o horário e pronto — sem mensagem, sem ligação.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">⏰</div>
            <h3>Lista de espera automática</h3>
            <p>Cancelamento de última hora? O sistema avisa automaticamente quem está na lista de espera. O horário se preenche sozinho, sem sua equipe ligar para ninguém.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔄</div>
            <h3>Sessões recorrentes organizadas</h3>
            <p>Configure o tratamento uma vez — número de sessões e frequência — e o sistema agenda as próximas automaticamente. Veja quem está em dia e quem parou no meio.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🚨</div>
            <h3>Detector de risco de faltas</h3>
            <p>Identifica pacientes com padrão de ausência antes de o horário ser perdido. Você age antes — e a sala não fica vazia.</p>
          </div>
        </div>
      </section>

      <section className="sec sec-alt" id="beneficios">
        <div className="demo-inner">
          <div className="demo-text">
            <span className="eyebrow" style={{ display: 'block' }}>Por que o Aseno</span>
            <h2 className="sec-title" style={{ textAlign: 'left' }}>3 motivos para usar<br/>o <span className="a1">Aseno</span> na sua clínica</h2>
            <div className="checklist">
              <div className="chk"><div className="chk-ic">🌙</div><span><strong>Agenda que nunca fecha</strong> — Seus pacientes agendam de madrugada, no fim de semana, no feriado. Você só abre o sistema e vê a agenda preenchida.</span></div>
              <div className="chk"><div className="chk-ic">📲</div><span><strong>Menos falta, menos buraco</strong> — Confirmações automáticas pelo WhatsApp e lista de espera garantem que sua agenda não fique com horários vazios.</span></div>
              <div className="chk"><div className="chk-ic">🙌</div><span><strong>Recepção livre para o que importa</strong> — Sua equipe para de atender telefone o dia inteiro e foca no atendimento presencial.</span></div>
            </div>
          </div>
          <div>
            <div className="phone-wrap">
              <div className="phone-hd">
                <div className="phone-av">💬</div>
                <div><div className="phone-nm">Clínica Saúde</div><div className="phone-st">● Online</div></div>
              </div>
              <div className="msgs">
                <div className="msg msg-in">Olá Lucas! Lembrete: sua sessão de fisioterapia é amanhã às 09h (sessão 3 de 10). Confirma sua presença?<div className="msg-time">08:00</div></div>
                <div className="msg msg-out">Confirmado, obrigado!<div className="msg-time">08:05</div></div>
                <div className="msg msg-in">Presença confirmada. Até amanhã!<div className="msg-time">08:05</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec testi-sec">
        <div className="sec-hd">
          <span className="eyebrow">Depoimentos</span>
          <h2 className="sec-title">Quem usa, <span className="a1">recomenda</span></h2>
          <p className="sec-sub">Clínicas que pararam de depender do telefone para preencher a agenda.</p>
        </div>
        <div className="testi-grid">
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Antes eu perdia paciente porque ninguém atendia fora do horário. Agora recebo agendamentos até de madrugada pelo portal.</p><div className="testi-auth">Clínica Vitalitá</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">A confirmação automática pelo WhatsApp cortou nossas faltas pela metade. Minha recepcionista finalmente tem tempo para o que importa.</p><div className="testi-auth">Studio Bem Estar</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Coloquei o link na bio do Instagram e os agendamentos dispararam. Simples assim.</p><div className="testi-auth">Espaço Corpo & Mente</div></div>
        </div>
      </section>

      <PricingSection lng={params.lng} />

      <section className="sec" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
        <div className="sec-hd" style={{ marginBottom: '2.5rem' }}>
          <span className="eyebrow">Dúvidas</span>
          <h2 className="sec-title">Perguntas <span className="a2">frequentes</span></h2>
        </div>
        <div className="faq-grid">
          <details className="faq-item"><summary>O paciente precisa instalar algum aplicativo para agendar?</summary><p>Não. O portal do paciente funciona direto no navegador, no celular ou no computador. O paciente acessa o link, escolhe o horário e confirma — sem baixar nada.</p></details>
          <details className="faq-item"><summary>Posso controlar quais horários ficam disponíveis para agendamento online?</summary><p>Sim. Você define os horários disponíveis por profissional, os intervalos entre sessões e pode bloquear períodos específicos. O paciente só vê os horários que você liberou.</p></details>
          <details className="faq-item"><summary>E se o paciente agendar e não aparecer?</summary><p>O Aseno envia confirmações automáticas por WhatsApp em três momentos antes da sessão. Se o paciente não confirma, o detector de risco sinaliza e a lista de espera é acionada para preencher o horário.</p></details>
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
