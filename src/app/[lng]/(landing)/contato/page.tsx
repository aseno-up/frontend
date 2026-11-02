import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingFooter } from '../landing-footer'
import { ContactForm } from './contact-form'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Contato | Aseno — Sistema de Agendamento para Clínicas',
  description: 'Entre em contato com o Aseno. Tire dúvidas, envie sugestões ou solicite ajuda sobre o sistema de agendamento para clínicas.',
}

export default function ContatoPage() {
  return (
    <div className="landing-body">
      <nav className="landing-nav">
        <Link href="/" className="nav-logo">
          aseno<span className="nav-logo-dot" />
        </Link>
        <div className="nav-cta">
          <Link href="/login" className="btn-ghost">Entrar</Link>
          <Link href="/register" className="btn-nav">Criar conta</Link>
        </div>
      </nav>

      <main className="contact-page">
        <div className="contact-container">
          <h1 className="contact-title">Contato</h1>
          <p className="contact-sub">
            Tem alguma duvida, sugestão ou precisa de ajuda? Envie uma mensagem e responderemos o mais breve possível.
          </p>

          <ContactForm />

          <div className="contact-info">
            <h3>Outras formas de contato</h3>
            <div className="contact-info-item">
              <div className="contact-info-icon">✉</div>
              <span><a href="mailto:contato@aseno.com.br" className="legal-link">contato@aseno.com.br</a></span>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
