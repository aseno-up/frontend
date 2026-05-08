import type { Metadata } from 'next'
import Image from 'next/image'
import { HeroCTA, NavCTA, PricingSection, CtaSection, type PublicConfig } from './landing-client'
import { LandingFooter } from './landing-footer'
import './landing.css'

export const metadata: Metadata = {
  title: 'Aseno — Sistema de Agendamento Inteligente para Clínicas',
  description: 'Reduza faltas na sua clínica com confirmações automáticas no WhatsApp. Agenda online, sessões recorrentes, teleconsulta e pagamentos integrados.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

// Cache plan/trial config indefinitely. Admin price changes trigger an
// explicit revalidateTag('public-config') to invalidate immediately, so no TTL
// is needed — the cache only refreshes when pricing is updated.
async function getPublicConfig(): Promise<PublicConfig | null> {
  try {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
    const response = await fetch(`${baseUrl}/api/v1/public/config`, {
      next: { revalidate: false, tags: ['public-config'] },
    })
    if (!response.ok) return null
    return (await response.json()) as PublicConfig
  } catch {
    return null
  }
}

export default async function LandingPage(props: PageProps) {
  const params = await props.params
  const publicConfig = await getPublicConfig()

  return (
    <div className="landing-body">
      {/* ─── NAV ─── */}
      <nav className="landing-nav">
        <a href="#" className="nav-logo">aseno<div className="nav-logo-dot"></div></a>
        <ul className="nav-links">
          <li><a href="#produto">Produto</a></li>
          <li><a href="#como-funciona">Como Funciona</a></li>
          <li><a href="#precos">Planos</a></li>
        </ul>
        <NavCTA lng={params.lng} />
      </nav>

      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Cada falta custa dinheiro.<br/>
            <span className="hero-title-accent">O Aseno cobra o paciente por você.</span>
          </h1>
          <p className="hero-sub">
            Confirmação automática no WhatsApp com IA que entende respostas humanas.
            Sua recepção para de ligar, sua agenda para de esvaziar.
          </p>
          <HeroCTA lng={params.lng} publicConfig={publicConfig} />
          <p className="hero-note">Sem cartão de crédito. Começa a funcionar hoje.</p>
        </div>
        <div className="hero-screenshot">
          <Image
            src="/screenshots/dasboard.png"
            alt="Dashboard do Aseno mostrando faturamento, ocupação e confirmações"
            width={1440}
            height={900}
            quality={90}
            priority
            className="hero-img"
          />
        </div>
      </section>

      {/* ─── PROVA SOCIAL ─── */}
      <div className="proof-bar">
        <div className="proof-inner">
          <div className="proof-item">
            <div className="proof-num">R$ 25.846</div>
            <div className="proof-lbl">Faturamento recuperado por clínica nos últimos 3 meses*</div>
          </div>
          <div className="proof-sep"></div>
          <div className="proof-item">
            <div className="proof-num">95,9%</div>
            <div className="proof-lbl">Taxa de comparecimento com confirmação automática</div>
          </div>
          <div className="proof-sep"></div>
          <div className="proof-item">
            <div className="proof-num">3.258</div>
            <div className="proof-lbl">Sessões realizadas sem uma ligação de confirmação</div>
          </div>
        </div>
        <p className="proof-note">*Dados reais de clínicas ativas na plataforma</p>
      </div>

      {/* ─── PRODUTO: BENTO GRID ─── */}
      <section className="sec-product" id="produto">
        <div className="sec-hd">
          <h2 className="display-title">Sua clínica funciona.<br/>Mesmo sem a recepção ligar.</h2>
        </div>

        <div className="bento">
          {/* Bloco principal: Agenda */}
          <div className="bento-main">
            <div className="bento-label">Agenda inteligente</div>
            <h3 className="bento-title">Visualize a semana inteira. Saiba quem confirmou, quem faltou, quem reagendou.</h3>
            <div className="bento-screenshot">
              <Image
                src="/screenshots/agenda-semanal.png"
                alt="Agenda semanal do Aseno com status de confirmação por paciente"
                width={1440}
                height={900}
                quality={85}
                className="bento-img"
              />
            </div>
          </div>

          {/* Bloco lateral: WhatsApp */}
          <div className="bento-side bento-whatsapp">
            <div className="bento-label">WhatsApp com IA</div>
            <h3 className="bento-title">O paciente responde com texto livre. A IA entende e atualiza o status.</h3>
            <div className="bento-chat">
              <div className="chat-bubble chat-in">Olá Maria! Lembrete: sua consulta é amanhã às 14h. Confirma sua presença?<span className="chat-time">08:00</span></div>
              <div className="chat-bubble chat-out">Vou levar minha filha na escola e chego às 14h05 😊<span className="chat-time">08:05</span></div>
              <div className="chat-bubble chat-in">Perfeito! Sua consulta está confirmada. Até amanhã!<span className="chat-time">08:05</span></div>
            </div>
          </div>

          {/* Bloco: Financeiro */}
          <div className="bento-side bento-finance">
            <div className="bento-label">Financeiro</div>
            <h3 className="bento-title">Saiba exatamente quanto cada falta custa. Por profissional, por mês.</h3>
            <div className="bento-screenshot">
              <Image
                src="/screenshots/financeiro-faturamento-perdido.png"
                alt="Relatório de faturamento perdido por faltas no Aseno"
                width={1440}
                height={900}
                quality={85}
                className="bento-img"
              />
            </div>
          </div>

          {/* Bloco: Sessões recorrentes */}
          <div className="bento-wide">
            <div className="bento-wide-text">
              <div className="bento-label">Sessões recorrentes</div>
              <h3 className="bento-title">Crie planos com 10, 20 ou 50 sessões. Individual ou turma. O paciente acompanha a evolução pelo portal.</h3>
              <ul className="bento-list">
                <li>Contador automático de sessões realizadas</li>
                <li>Pacotes individuais ou em turma</li>
                <li>Pagamento vinculado ao plano</li>
              </ul>
            </div>
            <div className="bento-wide-img">
              <Image
                src="/screenshots/plano-de-sessao.png"
                alt="Criação de plano de sessão recorrente no Aseno"
                width={960}
                height={480}
                quality={85}
                className="bento-img"
              />
            </div>
          </div>

          {/* Bloco: Venda de pacotes */}
          <div className="bento-wide">
            <div className="bento-wide-text">
              <div className="bento-label">Venda de pacotes</div>
              <h3 className="bento-title">Monte um orçamento, feche a venda e o financeiro já sabe. Sem planilha, sem retrabalho.</h3>
              <ul className="bento-list">
                <li>Orçamento e venda fechada no mesmo lugar — converta com 1 clique</li>
                <li>Parcelas geradas automaticamente no financeiro (PIX, cartão ou parcelado)</li>
                <li>Recibo enviado pelo WhatsApp para o paciente</li>
                <li>Saldo de sessões consumido conforme os agendamentos</li>
                <li>Baixa automática no caixa quando o pagamento cai</li>
              </ul>
            </div>
            <div className="bento-wide-img">
              <Image
                src="/screenshots/financeiro-caixa.png"
                alt="Recebíveis e parcelas geradas automaticamente a partir de uma venda de pacote no Aseno"
                width={960}
                height={480}
                quality={85}
                className="bento-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES COMPACTAS ─── */}
      <section className="sec-features">
        <div className="sec-hd">
          <h2 className="display-title">E tudo isso também.</h2>
          <p className="sec-sub">Sem instalar nada. Funciona no celular, tablet e computador.</p>
        </div>
        <div className="compact-grid">
          <div className="compact-item"><div className="compact-dot"></div><span>Agenda diária, semanal e mensal</span></div>
          <div className="compact-item"><div className="compact-dot"></div><span>Agendamento público (link na bio)</span></div>
          <div className="compact-item"><div className="compact-dot"></div><span>Portal do Paciente</span></div>
          <div className="compact-item"><div className="compact-dot"></div><span>Teleconsulta via Google Meet</span></div>
          <div className="compact-item"><div className="compact-dot"></div><span>Google Calendar bidirecional</span></div>
          <div className="compact-item"><div className="compact-dot"></div><span>Ficha e histórico do paciente</span></div>
          <div className="compact-item"><div className="compact-dot"></div><span>Anamnese customizável</span></div>
          <div className="compact-item"><div className="compact-dot"></div><span>Relatórios de presença e faturamento</span></div>
          <div className="compact-item"><div className="compact-dot"></div><span>Controle de acesso por perfil</span></div>
          <div className="compact-item"><div className="compact-dot"></div><span>Lista de espera automática</span></div>
          <div className="compact-item"><div className="compact-dot"></div><span>Pagamentos PIX e Cartão</span></div>
          <div className="compact-item"><div className="compact-dot"></div><span>Backup diário automático</span></div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ─── */}
      <section className="sec-how" id="como-funciona">
        <div className="sec-hd">
          <h2 className="display-title">Funciona em 4 passos.<br/>Leva menos de 5 minutos.</h2>
        </div>
        <div className="how-flow">
          <div className="how-card">
            <div className="how-number">01</div>
            <h3>Agende a consulta</h3>
            <p>Crie atendimentos únicos ou planos recorrentes no painel. Ou deixe o paciente agendar sozinho pelo link.</p>
          </div>
          <div className="how-card">
            <div className="how-number">02</div>
            <h3>WhatsApp automático</h3>
            <p>Horas antes da consulta, o paciente recebe o lembrete. Confirma, cancela ou reagenda sem ligar.</p>
          </div>
          <div className="how-card">
            <div className="how-number">03</div>
            <h3>IA entende a resposta</h3>
            <p>O paciente responde com texto livre. A IA interpreta e atualiza o status na agenda automaticamente.</p>
          </div>
          <div className="how-card">
            <div className="how-number">04</div>
            <h3>Agenda atualizada</h3>
            <p>Confirmado, cancelado ou reagendado. Tudo sincronizado com Google Calendar. Zero trabalho manual.</p>
          </div>
        </div>
      </section>

      {/* ─── MOBILE ─── */}
      <section className="sec-mobile">
        <div className="mobile-content">
          <h2 className="display-title">Funciona no bolso.<br/>Literalmente.</h2>
          <p className="sec-sub">Interface 100% responsiva. Acompanhe agendamentos, confirmações e faturamento de qualquer lugar.</p>
        </div>
        <div className="mobile-img-wrap">
          <Image
            src="/screenshots/dashboard-responsivo.png"
            alt="Dashboard do Aseno em tela de celular"
            width={375}
            height={812}
            quality={90}
            className="mobile-img"
          />
        </div>
      </section>

      {/* ─── PARA QUEM ─── */}
      <section className="sec-audience">
        <div className="sec-hd">
          <h2 className="display-title">Se você agenda sessões e perde dinheiro com faltas,<br/><span className="accent-teal">o Aseno foi feito pra você.</span></h2>
        </div>
        <div className="audience-grid">
          <div className="audience-item"><h3>Estética</h3><p>Procedimentos, região tratada e sessões recorrentes. Do facial ao corporal.</p></div>
          <div className="audience-item"><h3>Fisioterapia</h3><p>Evolução clínica, contador de sessões e planos de tratamento completos.</p></div>
          <div className="audience-item"><h3>Psicologia</h3><p>Sessões semanais recorrentes, ficha do paciente e lembretes sem esforço.</p></div>
          <div className="audience-item"><h3>Pilates e Yoga</h3><p>Planos de sessão, controle de frequência e agenda por instrutor.</p></div>
          <div className="audience-item"><h3>Nutrição</h3><p>Retornos automáticos e lembretes que reduzem faltas nas consultas.</p></div>
          <div className="audience-item"><h3>Massoterapia</h3><p>Sessões avulsas ou pacotes. O paciente agenda pelo link, recebe lembrete no WhatsApp.</p></div>
        </div>
      </section>

      {/* ─── DEPOIMENTOS ─── */}
      <section className="sec-testimonials">
        <div className="sec-hd">
          <h2 className="display-title">Quem usa, recomenda.</h2>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p className="testimonial-text">&ldquo;Desde que implementamos, nossas faltas caíram drasticamente. A confirmação automática pelo WhatsApp é incrível — a recepção não precisa mais ligar pra ninguém.&rdquo;</p>
            <div className="testimonial-author">
              <Image
                src="https://i.pravatar.cc/96?img=32"
                alt="Marina Costa"
                width={48}
                height={48}
                className="testimonial-photo"
              />
              <div className="testimonial-info">
                <div className="testimonial-name">Marina Costa</div>
                <div className="testimonial-role">Coordenadora Clínica · Clínica Vitalitá</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <p className="testimonial-text">&ldquo;Nossa recepcionista economiza horas por dia. O Aseno faz o trabalho pesado de confirmar e reagendar sozinho. A gente só acompanha.&rdquo;</p>
            <div className="testimonial-author">
              <Image
                src="https://i.pravatar.cc/96?img=47"
                alt="Beatriz Mendes"
                width={48}
                height={48}
                className="testimonial-photo"
              />
              <div className="testimonial-info">
                <div className="testimonial-name">Beatriz Mendes</div>
                <div className="testimonial-role">Diretora · Clínica Bem Estar</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <p className="testimonial-text">&ldquo;A lista de espera automática é fantástica. Quando uma paciente cancela, o sistema notifica quem está aguardando e preenche a vaga em minutos.&rdquo;</p>
            <div className="testimonial-author">
              <Image
                src="https://i.pravatar.cc/96?img=12"
                alt="Rafael Almeida"
                width={48}
                height={48}
                className="testimonial-photo"
              />
              <div className="testimonial-info">
                <div className="testimonial-name">Rafael Almeida</div>
                <div className="testimonial-role">Psicólogo Clínico · Instituto Mente Sã</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <PricingSection lng={params.lng} publicConfig={publicConfig} />

      {/* ─── FAQ ─── */}
      <section className="sec-faq">
        <div className="sec-hd">
          <h2 className="display-title">Perguntas frequentes</h2>
        </div>
        <div className="faq-grid">
          <details className="faq-item"><summary>Preciso instalar algo?</summary><p>Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.</p></details>
          <details className="faq-item"><summary>Funciona no celular?</summary><p>Sim. Interface totalmente responsiva em qualquer smartphone, tablet ou computador.</p></details>
          <details className="faq-item"><summary>Preciso de cartão para testar?</summary><p>Não. 14 dias com acesso completo, sem cartão de crédito.</p></details>
          <details className="faq-item"><summary>O preço é por profissional?</summary><p>Não. O preço é por clínica. No plano Profissional, até 7 profissionais pagam o mesmo valor.</p></details>
          <details className="faq-item"><summary>Meu paciente pode agendar sozinho?</summary><p>Sim. Você recebe um link exclusivo para colocar no Instagram, site ou onde quiser. O paciente agenda 24/7.</p></details>
          <details className="faq-item"><summary>O WhatsApp da clínica pode ser banido?</summary><p>Com o WhatsApp Oficial (plano Profissional), não. É a API autorizada pela Meta, sem risco de banimento.</p></details>
          <details className="faq-item"><summary>Como funciona o pagamento online?</summary><p>No plano Profissional, sua clínica recebe pagamentos via PIX e Cartão de Crédito diretamente na sua conta. O paciente paga ao agendar e o dinheiro cai direto na conta da clínica, sem intermediários.</p></details>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <CtaSection lng={params.lng} publicConfig={publicConfig} />

      {/* ─── FOOTER ─── */}
      <LandingFooter />
    </div>
  )
}
