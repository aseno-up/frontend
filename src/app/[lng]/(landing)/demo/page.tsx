import type { Metadata } from 'next'
import Link from 'next/link'
import { NavCTA } from '../landing-client'
import { LandingFooter } from '../landing-footer'
import { DemoClient } from './demo-client'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Demo Interativa — Veja o WhatsApp do Aseno em ação',
  description: 'Digite os dados de uma consulta e veja, em tempo real, como o Aseno conversa com seu paciente pelo WhatsApp. Sem cadastro, sem cartão.',
}

interface PageProps {
  params: Promise<{ lng: string }>
}

export default async function DemoPage(props: PageProps) {
  const params = await props.params

  return (
    <div className="landing-body">
      {/* NAV */}
      <nav className="landing-nav">
        <Link href={`/${params.lng}`} className="nav-logo">
          aseno<div className="nav-logo-dot"></div>
        </Link>
        <ul className="nav-links">
          <li><Link href={`/${params.lng}#produto`}>Produto</Link></li>
          <li><Link href={`/${params.lng}#como-funciona`}>Como Funciona</Link></li>
          <li><Link href={`/${params.lng}#precos`}>Planos</Link></li>
        </ul>
        <NavCTA lng={params.lng} />
      </nav>

      {/* HERO */}
      <section className="demo-hero">
        <div className="demo-hero-content">
          <h1 className="demo-hero-title">
            Veja o Aseno conversando com<br/>
            <span className="hero-title-accent">um paciente seu.</span>
          </h1>
          <p className="demo-hero-sub">
            Digite os dados de uma consulta real. A IA monta o lembrete no WhatsApp e mostra como reage
            quando o paciente confirma, reagenda, cancela ou paga — no mesmo segundo.
          </p>
        </div>
      </section>

      {/* DEMO STAGE */}
      <DemoClient lng={params.lng} />

      <LandingFooter />
    </div>
  )
}
