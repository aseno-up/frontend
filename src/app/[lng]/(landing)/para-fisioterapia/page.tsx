import type { Metadata } from 'next'
import { HeroCTA, NavCTA, PricingSection, CtaSection } from '../landing-client'
import { LandingFooter } from '../landing-footer'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Software para Clínicas de Fisioterapia | Aseno',
  description: 'Gerencie sessões, reduza faltas e acompanhe a evolução de cada paciente. O Aseno foi feito para clínicas de fisioterapia que trabalham com tratamentos contínuos.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

export default async function FisioterapiaLandingPage(props: PageProps) {
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
          <div className="hero-badge"><div className="hero-badge-dot"></div>Para clínicas de fisioterapia com tratamentos contínuos</div>
          <h1 className="hero-title">Seus pacientes somem no meio do tratamento — e você <span className="a1">sabe</span> disso</h1>
          <p className="hero-sub">O Aseno ajuda clínicas de fisioterapia a manter os pacientes em tratamento, reduzir faltas e ter controle real da evolução de cada um — sem depender de planilha ou WhatsApp manual.</p>
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
                <div className="mk-stat"><div className="mk-stat-lbl">Hoje</div><div className="mk-stat-val b">10</div></div>
                <div className="mk-stat"><div className="mk-stat-lbl">Confirmados</div><div className="mk-stat-val g">8</div></div>
                <div className="mk-stat"><div className="mk-stat-lbl">Pendentes</div><div className="mk-stat-val y">2</div></div>
              </div>
              <div className="mk-grid">
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Próximos pacientes</div>
                  <div className="mk-row"><span className="mk-row-n">Carlos Andrade — 08:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Mariana Silva — 09:00</span><span className="bdg bdg-g">Confirmado</span></div>
                  <div className="mk-row"><span className="mk-row-n">Roberto Mendes — 10:00</span><span className="bdg bdg-y">Pendente</span></div>
                </div>
                <div className="mk-panel">
                  <div className="mk-panel-ttl">Tratamentos</div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Carlos — RPG 5/12</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Mariana — Pilates 8/20</span></div>
                  <div className="mk-msg"><div className="msg-dot"></div><span>Roberto — Pós-op. joelho 2/15</span></div>
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
            <h3>Paciente abandona o tratamento</h3>
            <p>Chega com dor aguda, você monta o plano de sessões, ele melhora nos primeiros atendimentos... e para de aparecer. Sem aviso. Sem justificativa. E você só descobre quando o horário fica vago.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📋</div>
            <h3>Evolução clínica espalhada</h3>
            <p>O que foi feito na sessão anterior, quais exercícios foram prescritos, como o paciente está respondendo — vira um exercício de memória quando a ficha está em papel ou espalhada em vários lugares.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📱</div>
            <h3>Confirmação manual o dia inteiro</h3>
            <p>Você ou sua recepcionista entram no WhatsApp um a um, perguntam se o paciente vem, esperam resposta, anotam em algum lugar. Isso custa tempo que poderia estar sendo usado com o paciente.</p>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      <section className="sec" id="solucao">
        <div className="sec-hd">
          <span className="eyebrow">A solução</span>
          <h2 className="sec-title">Tudo que sua clínica de fisioterapia precisa<br/><span className="a2">em um só lugar</span></h2>
          <p className="sec-sub">O Aseno foi pensado para clínicas que trabalham com tratamentos contínuos e sessões recorrentes.</p>
        </div>
        <div className="feat-grid">
          <div className="feat-card">
            <div className="feat-icon">🔄</div>
            <h3>Sessões recorrentes com plano de tratamento</h3>
            <p>Cadastre o plano de sessões do paciente e agende os atendimentos de forma sequencial. Não precisa remarcar um a um toda semana. O fluxo do tratamento fica organizado desde o início.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📋</div>
            <h3>Ficha e histórico do paciente</h3>
            <p>Cada paciente tem sua ficha clínica com histórico completo de atendimentos. Registre evolução, intercorrências e observações diretamente no sistema — acessível por qualquer dispositivo.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">💬</div>
            <h3>Confirmação automática via WhatsApp</h3>
            <p>Lembretes automáticos 48h, 24h e 2h antes de cada sessão — sem você precisar fazer nada. O paciente confirma ou cancela e o sistema atualiza a agenda em tempo real.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🚨</div>
            <h3>Detector de risco de faltas</h3>
            <p>O sistema identifica pacientes com padrão de ausência ou baixa adesão e sinaliza antes que eles abandonem o tratamento. Você age antes de perder o caso.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔒</div>
            <h3>Controle de acesso por perfil</h3>
            <p>Para clínicas com mais de um fisioterapeuta: cada profissional acessa apenas sua agenda e seus pacientes. Você mantém visão geral sem abrir informação desnecessária para toda a equipe.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔗</div>
            <h3>Teleconsulta e orientação remota</h3>
            <p>Para sessões de orientação, reavaliação ou pacientes que não podem comparecer: gere o link direto pelo Aseno, sem sair do sistema.</p>
          </div>
        </div>
      </section>

      <section className="sec sec-alt" id="beneficios">
        <div className="demo-inner">
          <div className="demo-text">
            <span className="eyebrow" style={{ display: 'block' }}>Por que o Aseno</span>
            <h2 className="sec-title" style={{ textAlign: 'left' }}>3 motivos para usar<br/>o <span className="a1">Aseno</span> na sua clínica</h2>
            <div className="checklist">
              <div className="chk"><div className="chk-ic">🗓️</div><span><strong>Tratamentos que chegam ao fim</strong> — Planos de sessão organizados e alertas de risco de abandono para manter o paciente no fluxo de tratamento.</span></div>
              <div className="chk"><div className="chk-ic">📋</div><span><strong>Histórico clínico acessível</strong> — Ficha completa por paciente, com evolução registrada em cada atendimento — sem papel, sem memória, sem retrabalho.</span></div>
              <div className="chk"><div className="chk-ic">📲</div><span><strong>Agenda que se confirma sozinha</strong> — Lembretes automáticos por WhatsApp eliminam a confirmação manual e liberam tempo da sua equipe.</span></div>
            </div>
          </div>
          <div>
            <div className="phone-wrap">
              <div className="phone-hd">
                <div className="phone-av">💬</div>
                <div><div className="phone-nm">Clínica Fisioterapia</div><div className="phone-st">● Online</div></div>
              </div>
              <div className="msgs">
                <div className="msg msg-in">Olá Carlos! Lembrete: sua sessão de RPG é amanhã às 08h (sessão 5 de 12). Confirma sua presença?<div className="msg-time">08:00</div></div>
                <div className="msg msg-out">Confirmo! Já estou sentindo melhora na postura<div className="msg-time">08:15</div></div>
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
          <p className="sec-sub">Clínicas de fisioterapia que transformaram sua gestão com o Aseno.</p>
        </div>
        <div className="testi-grid">
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Desde que implementamos, nossas faltas caíram drasticamente. A confirmação automática pelo WhatsApp é incrível — não precisamos mais ligar para cada paciente.</p><div className="testi-auth">Clínica FisioVida</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">O controle do plano de tratamento mudou tudo. Antes eu perdia paciente no meio da reabilitação e nem sabia. Agora vejo quem está em risco de abandonar.</p><div className="testi-auth">Instituto de Reabilitação Postural</div></div>
          <div className="testi-card"><div className="testi-q">&quot;</div><p className="testi-txt">Ter o histórico clínico acessível em qualquer dispositivo economiza tempo entre atendimentos. Não preciso mais procurar fichas em papel.</p><div className="testi-auth">Clínica Movimento & Saúde</div></div>
        </div>
      </section>

      <PricingSection lng={params.lng} />

      <section className="sec" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
        <div className="sec-hd" style={{ marginBottom: '2.5rem' }}>
          <span className="eyebrow">Dúvidas</span>
          <h2 className="sec-title">Perguntas <span className="a2">frequentes</span></h2>
        </div>
        <div className="faq-grid">
          <details className="faq-item"><summary>O Aseno funciona para fisioterapeuta autônomo, sem clínica?</summary><p>Sim. O plano Básico atende até 5 profissionais e é usado tanto por clínicas pequenas quanto por fisioterapeutas que trabalham de forma independente. Você tem agenda, ficha de paciente, confirmação automática e portal de agendamento online — tudo que precisa para organizar seus atendimentos.</p></details>
          <details className="faq-item"><summary>Preciso migrar todos os dados do meu sistema atual?</summary><p>Não necessariamente. Você pode começar do zero com os novos pacientes. Se quiser importar sua base de dados de um sistema anterior, isso está disponível no plano Avançado — e a equipe do Aseno te ajuda nesse processo.</p></details>
          <details className="faq-item"><summary>O WhatsApp automático pode ser banido?</summary><p>No plano Profissional, o Aseno usa o WhatsApp Oficial (API oficial da Meta), o que elimina o risco de banimento. No plano Básico, as mensagens são enviadas via integração com o WhatsApp Web — funciona bem para volumes menores, mas exige que o número esteja conectado.</p></details>
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
