import type { Metadata } from 'next'
import { HeroCTA, NavCTA, PricingSection, CtaSection } from '../landing-client'
import { LandingFooter } from '../landing-footer'
import { getActivePromotion } from '@/lib/server/promotion'
import '../landing.css'
import './autonomos.css'

export const metadata: Metadata = {
  title: 'Aseno para profissionais autônomos — agenda, WhatsApp e financeiro em um só lugar',
  description:
    'Você atende, agenda, cobra e responde mensagens. O Aseno automatiza a parte que ninguém te paga pra fazer: confirmações no WhatsApp, lembretes, recebimentos e o histórico de cada paciente.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

async function getPublicConfig() {
  try {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4901').replace(
      /\/api\/v1\/?$/,
      '',
    )
    const response = await fetch(`${baseUrl}/api/v1/public/config`, {
      next: { revalidate: false, tags: ['public-config'] },
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export default async function AutonomosPage(props: PageProps) {
  const params = await props.params
  const [publicConfig, promotion] = await Promise.all([
    getPublicConfig(),
    getActivePromotion(),
  ])

  return (
    <div className="landing-body au-body">
      <nav className="landing-nav">
        <a href="#" className="nav-logo">
          aseno<div className="nav-logo-dot"></div>
        </a>
        <ul className="nav-links">
          <li><a href="#como-funciona">Como funciona</a></li>
          <li><a href="#precos">Planos</a></li>
        </ul>
        <NavCTA lng={params.lng} />
      </nav>

      <section className="au-hero">
        <div className="au-hero-text">
          <h1 className="au-hero-title">
            Você atende. O Aseno cuida do resto.
          </h1>
          <p className="au-hero-sub">
            Agenda, WhatsApp, financeiro e ficha do paciente em um só lugar.
            Feito pra quem trabalha sozinho — sem complicação de software de
            clínica grande.
          </p>
          <div className="au-hero-cta">
            <HeroCTA lng={params.lng} publicConfig={publicConfig} />
          </div>
          <p className="au-hero-note">Sem cartão de crédito. Cancela quando quiser.</p>
        </div>

        <div className="au-hero-video">
          <video
            className="au-video"
            poster="/videos/autonomos-hero-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src="/videos/autonomos-hero.webm" type="video/webm" />
            <source src="/videos/autonomos-hero.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <section className="au-section" id="como-funciona">
        <div className="au-section-hd">
          <h2 className="au-h2">Como funciona</h2>
        </div>
        <ol className="au-steps">
          <li>
            <span className="au-step-num">01</span>
            <div>
              <h3>Você cadastra seus horários e seus pacientes</h3>
              <p>
                Crie sua agenda em alguns minutos. Importe seus contatos
                quando quiser — não precisa cadastrar tudo de uma vez.
              </p>
            </div>
          </li>
          <li>
            <span className="au-step-num">02</span>
            <div>
              <h3>O Aseno confirma os agendamentos por você</h3>
              <p>
                Antes de cada atendimento, o paciente recebe lembrete no
                WhatsApp. Se responder &ldquo;não vou&rdquo;, o horário é liberado
                automaticamente.
              </p>
            </div>
          </li>
          <li>
            <span className="au-step-num">03</span>
            <div>
              <h3>Você vê o que entra de dinheiro e o que falta receber</h3>
              <p>
                Pacotes, sessões avulsas e mensalidades aparecem no
                financeiro com baixa automática. Sem planilha paralela.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="au-section au-section-alt">
        <div className="au-section-hd">
          <h2 className="au-h2">O que está incluso</h2>
          <p className="au-section-sub">
            O essencial pra trabalhar sozinho. Nada que você não vai usar.
          </p>
        </div>
        <div className="au-grid">
          <div className="au-grid-item">
            <h3>Agenda online</h3>
            <p>
              Seus pacientes agendam direto pelo link, sem precisar te
              chamar. Você aprova ou recusa.
            </p>
          </div>
          <div className="au-grid-item">
            <h3>Confirmação automática</h3>
            <p>
              Mensagem no WhatsApp 24h antes. A resposta atualiza o status
              na sua agenda em tempo real.
            </p>
          </div>
          <div className="au-grid-item">
            <h3>Pacotes de sessões</h3>
            <p>
              Venda 10 sessões pra um paciente e o sistema controla o saldo.
              Sem caderneta na recepção que você não tem.
            </p>
          </div>
          <div className="au-grid-item">
            <h3>Ficha do paciente</h3>
            <p>
              Anotações de cada atendimento, anexos e evolução —
              acessível pelo celular durante a próxima sessão.
            </p>
          </div>
          <div className="au-grid-item">
            <h3>Pagamentos</h3>
            <p>
              PIX e cartão integrados. O paciente paga no link, o
              dinheiro cai e o financeiro atualiza sozinho.
            </p>
          </div>
          <div className="au-grid-item">
            <h3>Portal do paciente</h3>
            <p>
              Cada paciente acompanha as próprias sessões, vê os
              próximos agendamentos e baixa recibos.
            </p>
          </div>
        </div>
      </section>

      <PricingSection lng={params.lng} publicConfig={publicConfig} promotion={promotion} />

      <section className="au-section au-faq">
        <div className="au-section-hd">
          <h2 className="au-h2">Perguntas frequentes</h2>
        </div>
        <div className="au-faq-list">
          <details>
            <summary>Funciona se eu trabalho sozinho, em casa?</summary>
            <p>
              Sim. Esse é o cenário pensado. Não tem recepcionista pra
              configurar, não tem equipe pra dar permissão. Você usa do
              celular ou do computador, como preferir.
            </p>
          </details>
          <details>
            <summary>Preciso ter CNPJ?</summary>
            <p>
              Não. Você pode usar como pessoa física. Quando emitir
              recibos, o sistema usa os dados que você cadastrar.
            </p>
          </details>
          <details>
            <summary>Meus pacientes precisam baixar algum app?</summary>
            <p>
              Não. Tudo acontece pelo WhatsApp e pelo navegador.
              Os agendamentos e confirmações chegam pra eles
              naturalmente.
            </p>
          </details>
          <details>
            <summary>E se eu não gostar?</summary>
            <p>
              Cancela quando quiser, direto pela plataforma. Sem multa,
              sem ligar pra ninguém.
            </p>
          </details>
        </div>
      </section>

      <CtaSection lng={params.lng} publicConfig={publicConfig} />

      <LandingFooter />
    </div>
  )
}
