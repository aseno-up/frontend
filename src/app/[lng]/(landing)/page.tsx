'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import './landing.css'

interface PageProps {
  params: Promise<{ lng: string }>
}

interface PublicConfig {
  trial_days: number
  plans: {
    [key: string]: {
      limit_professionals: number
      price_monthly: number
      price_yearly: number
      excess_price: number
    }
  }
}

export default function LandingPage(props: PageProps) {
  const params = use(props.params)
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually')
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(/\/api\/v1\/?$/, '')
        const response = await fetch(`${baseUrl}/api/v1/public/config`, { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          setPublicConfig(data)
        }
      } catch (err) {}
    }
    fetchConfig()
  }, [])

  const calculateMonthlyPrice = (plan: 'basic' | 'professional' | 'advanced') => {
    if (!publicConfig) return '—'
    const planData = publicConfig.plans[plan]
    if (!planData) return '—'
    if (billingCycle === 'monthly') return planData.price_monthly.toString()
    if (planData.price_yearly > 0) {
      return Math.round(planData.price_yearly / 12).toString()
    }
    return Math.round((planData.price_monthly * 10) / 12).toString()
  }

  const handlePlanSelect = (plan: string) => {
    const target = isAuthenticated ? 'billing-setup' : 'register'
    const url = new URL(`/${params.lng}/${target}`, window.location.origin)
    url.searchParams.set('plan', plan)

    let cycle = billingCycle === 'annually' ? 'YEARLY' : 'MONTHLY'
    if (plan === 'trial') cycle = 'MONTHLY'

    url.searchParams.set('billing', cycle)

    const currentParams = new URLSearchParams(window.location.search)
    const offer = currentParams.get('offer')
    if (offer) {
      url.searchParams.set('offer', offer)
    }

    router.push(url.pathname + url.search)
  }

  const getTrialDays = (): number => {
    return publicConfig?.trial_days || 14
  }

  return (
    <div className="landing-body">
      <nav className="landing-nav">
        <a href="#" className="nav-logo">aseno<div className="nav-logo-dot"></div></a>
        <ul className="nav-links">
          <li><a href="#recursos">Recursos</a></li>
          <li><a href="#como-funciona">Como Funciona</a></li>
          <li><a href="#precos">Planos</a></li>
        </ul>
        <div className="nav-cta">
          <button className="btn-ghost" onClick={() => router.push(`/${params.lng}/login`)}>Entrar</button>
          <button className="btn-nav" onClick={() => handlePlanSelect('trial')}>Testar grátis</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge"><div className="hero-badge-dot"></div>Para clínicas de estética e fisioterapia</div>
          <h1 className="hero-title">Reduza <span className="a1">faltas</span> e pare de confirmar consultas no <span className="a2">manual</span></h1>
          <p className="hero-sub">Agenda simples, sessões recorrentes e confirmações automáticas no WhatsApp que atualizam o status sozinhas — sua equipe foca no atendimento.</p>
          <div className="hero-actions">
            <button className="btn-lg" onClick={() => handlePlanSelect('trial')}>Testar grátis por {getTrialDays()} dias &rarr;</button>
            <a href="#como-funciona" className="btn-lg-out">Ver demonstração</a>
          </div>
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
          <div className="feat-card"><div className="feat-icon">🔄</div><h3>Sessões Recorrentes</h3><p>Planos com várias sessões de uma vez. Ideal para tratamentos de fisioterapia, drenagem e protocolos estéticos.</p></div>
          <div className="feat-card"><div className="feat-icon">📊</div><h3>Relatórios</h3><p>Presença, faturamento e métricas de faltas. Identifique horários de risco e tome decisões baseadas em dados.</p></div>
          <div className="feat-card"><div className="feat-icon">👥</div><h3>Controle de Acesso</h3><p>Perfis por função: administrador, recepção e profissional. Cada usuário acessa somente as informações que precisa.</p></div>
          <div className="feat-card"><div className="feat-icon">📋</div><h3>Ficha do Paciente</h3><p>Histórico completo de atendimentos, procedimento executado, região tratada e evolução clínica detalhada.</p></div>
          <div className="feat-card"><div className="feat-icon">🗓️</div><h3>Google Calendar</h3><p>Sincronização bidirecional. Compromissos pessoais bloqueiam a agenda automaticamente.</p></div>
          <div className="feat-card"><div className="feat-icon">⏰</div><h3>Lista de Espera</h3><p>Cancelou? O sistema notifica quem está aguardando e preenche a vaga automaticamente.</p></div>
          <div className="feat-card"><div className="feat-icon">🔒</div><h3>Segurança e Backup</h3><p>Dados protegidos, backup diário automático e acesso seguro com autenticação por perfil.</p></div>
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
          <p className="sec-sub">Desenvolvido especificamente para as necessidades das clínicas de saúde e bem-estar.</p>
        </div>
        <div className="for-grid">
          <div className="for-card"><div className="for-icon">✨</div><h3>Clínicas de Estética</h3><p>Procedimento, região tratada e sessões recorrentes organizados. Do facial ao corporal.</p></div>
          <div className="for-card"><div className="for-icon">🦴</div><h3>Fisioterapia</h3><p>Tipo de sessão, evolução clínica, contador e acompanhamento de planos de tratamento.</p></div>
          <div className="for-card"><div className="for-icon">📱</div><h3>Quem usa WhatsApp</h3><p>Se sua equipe gasta tempo confirmando pelo WhatsApp manualmente, nós automatizamos tudo.</p></div>
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

      <section className="sec sec-alt" id="precos">
        <div className="sec-hd">
          <span className="eyebrow">Planos</span>
          <h2 className="sec-title">Simples e <span className="a1">transparente</span></h2>
          <p className="sec-sub">{getTrialDays()} dias grátis no plano Profissional. Sem cartão de crédito.</p>
        </div>
        <div className="ptoggle">
          <span style={{ fontWeight: billingCycle === 'monthly' ? 600 : 500, color: billingCycle === 'monthly' ? 'var(--ink)' : 'var(--ink-light)' }}>Mensal</span>
          <button className={`toggle-pill ${billingCycle === 'annually' ? 'active' : ''}`} onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}><div className="toggle-thumb"></div></button>
          <span style={{ fontWeight: billingCycle === 'annually' ? 600 : 500, color: billingCycle === 'annually' ? 'var(--ink)' : 'var(--ink-light)' }}>Anual {billingCycle === 'annually' && <span className="toggle-bdg">2 meses grátis</span>}</span>
        </div>
        <div className="price-grid">
          <div className="price-card">
            <div className="price-nm">Teste Grátis</div>
            <div className="price-amt">R$ 0</div>
            <div className="price-per">por {getTrialDays()} dias</div>
            <hr className="price-div" />
            <ul className="price-feats">
              <li>Todas as funções Profissional</li>
              <li>Sem cartão de crédito</li>
              <li>Acesso imediato</li>
            </ul>
            <button className="btn-p btn-p-fill" onClick={() => handlePlanSelect('trial')}>Começar grátis</button>
          </div>
          <div className="price-card">
            <div className="price-nm">Básico</div>
            <div className="price-amt"><sup>R$</sup> {calculateMonthlyPrice('basic')}</div>
            <div className="price-per">por mês</div>
            <hr className="price-div" />
            <ul className="price-feats">
              <li>Até 5 profissionais</li>
              <li>Agenda ilimitada</li>
              <li>Confirmações WhatsApp</li>
              <li>Sessões recorrentes</li>
              <li>Gestão de pacientes</li>
              <li>Suporte por e-mail</li>
            </ul>
            <button className="btn-p btn-p-out" onClick={() => handlePlanSelect('basic')}>Assinar agora</button>
          </div>
          <div className="price-card feat">
            <div className="feat-bdg">Recomendado</div>
            <div className="price-nm">Profissional</div>
            <div className="price-amt"><sup>R$</sup> {calculateMonthlyPrice('professional')}</div>
            <div className="price-per">por mês</div>
            <hr className="price-div" />
            <ul className="price-feats">
              <li>Até 15 profissionais</li>
              <li>Tudo do Básico</li>
              <li>Google Calendar</li>
              <li>Lista de Espera Automática</li>
              <li>Detector de Risco de Faltas</li>
              <li>Relatórios de Prejuízo</li>
              <li>Personalização de mensagens</li>
              <li>Suporte prioritário WhatsApp</li>
            </ul>
            <button className="btn-p btn-p-fill" onClick={() => handlePlanSelect('professional')}>Assinar agora</button>
          </div>
          <div className="price-card">
            <div className="price-nm">Avançado</div>
            <div className="price-amt"><sup>R$</sup> {calculateMonthlyPrice('advanced')}</div>
            <div className="price-per">por mês</div>
            <hr className="price-div" />
            <ul className="price-feats">
              <li>Profissionais ilimitados</li>
              <li>Tudo do Profissional</li>
              <li>API de integração</li>
              <li>Treinamento da equipe</li>
              <li>Importação de dados</li>
              <li>SLA de 99.9%</li>
              <li>Backup diário automático</li>
            </ul>
            <button className="btn-p btn-p-out" onClick={() => handlePlanSelect('advanced')}>Assinar agora</button>
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
        <div className="sec-hd" style={{ marginBottom: '2.5rem' }}>
          <span className="eyebrow">Dúvidas</span>
          <h2 className="sec-title">Perguntas <span className="a2">frequentes</span></h2>
        </div>
        <div className="faq-grid">
          <div className="faq-item"><h3>Preciso instalar algo?</h3><p>Não. O Aseno funciona 100% no navegador, sem instalação em nenhum dispositivo.</p></div>
          <div className="faq-item"><h3>Funciona no celular?</h3><p>Sim. Interface totalmente responsiva em qualquer smartphone, tablet ou computador.</p></div>
          <div className="faq-item"><h3>Preciso de cartão para testar?</h3><p>Não. {getTrialDays()} dias com acesso completo, sem cartão de crédito.</p></div>
        </div>
      </section>

      <section className="cta-sec">
        <h2 className="sec-title">Pronto para reduzir<br/>as faltas na sua clínica?</h2>
        <p className="cta-p">Junte-se a centenas de clínicas que já transformaram sua gestão com o Aseno.</p>
        <div className="cta-acts">
          <button className="btn-cta-w" onClick={() => handlePlanSelect('trial')}>Testar grátis por {getTrialDays()} dias &rarr;</button>
          <a href="#como-funciona" className="btn-cta-o">Ver demonstração</a>
        </div>
        <p className="cta-note">Sem cartão de crédito. Ativação imediata.</p>
      </section>

      <footer className="landing-footer">
        <div className="ft-grid">
          <div className="ft-brand">
            <a href="#" className="ft-logo">aseno<span>.</span></a>
            <p>Sistema de agendamento inteligente para clínicas de estética e fisioterapia.</p>
          </div>
          <div className="ft-col">
            <h4>Produto</h4>
            <ul>
              <li><a href="#recursos">Recursos</a></li>
              <li><a href="#precos">Preços</a></li>
              <li><a href="#">Integrações</a></li>
            </ul>
          </div>
          <div className="ft-col">
            <h4>Empresa</h4>
            <ul>
              <li><a href="#">Sobre</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Contato</a></li>
            </ul>
          </div>
          <div className="ft-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Termos de uso</a></li>
              <li><a href="#">Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="ft-bottom">
          <span>© 2026 Aseno. Todos os direitos reservados.</span>
          <span>Feito para quem cuida.</span>
        </div>
      </footer>
    </div>
  )
}