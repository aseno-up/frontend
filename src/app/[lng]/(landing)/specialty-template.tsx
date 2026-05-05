import Image from 'next/image'
import { HeroCTA, NavCTA, PricingSection, CtaSection } from './landing-client'
import { LandingFooter } from './landing-footer'
import './landing.css'

export interface SpecialtyProblem {
  title: string
  description: string
}

export interface SpecialtyFeature {
  title: string
  description: string
}

export interface SpecialtyReason {
  title: string
  description: string
}

export interface SpecialtyWhatsApp {
  clinicName: string
  messageIn: string
  messageOut: string
  messageReply: string
}

export interface SpecialtyTestimonial {
  text: string
  name: string
  role: string
  clinic: string
  photo: string
}

export interface SpecialtyFaq {
  question: string
  answer: string
}

export interface SpecialtyData {
  badge: string
  heroTitle: string
  heroTitleAccent: string
  heroSub: string
  heroNote: string
  problemTitle: string
  problems: SpecialtyProblem[]
  solutionTitle: string
  solutionSub: string
  features: SpecialtyFeature[]
  reasonsTitle: string
  reasons: SpecialtyReason[]
  whatsapp: SpecialtyWhatsApp
  testimonials: SpecialtyTestimonial[]
  faqs: SpecialtyFaq[]
}

interface SpecialtyTemplateProps {
  lng: string
  data: SpecialtyData
}

export function SpecialtyTemplate({ lng, data }: SpecialtyTemplateProps) {
  return (
    <div className="landing-body">
      {/* NAV */}
      <nav className="landing-nav">
        <a href="/" className="nav-logo">aseno<div className="nav-logo-dot"></div></a>
        <ul className="nav-links">
          <li><a href="#solucao">Solução</a></li>
          <li><a href="#beneficios">Benefícios</a></li>
          <li><a href="#precos">Planos</a></li>
        </ul>
        <NavCTA lng={lng} />
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="sp-badge">{data.badge}</div>
          <h1 className="hero-title">
            {data.heroTitle}<br/>
            <span className="hero-title-accent">{data.heroTitleAccent}</span>
          </h1>
          <p className="hero-sub">{data.heroSub}</p>
          <HeroCTA lng={lng} />
          <p className="hero-note">{data.heroNote}</p>
        </div>
        <div className="hero-screenshot hero-screenshot-sm">
          <Image
            src="/screenshots/agenda-semanal.png"
            alt="Agenda semanal do Aseno"
            width={1440}
            height={900}
            quality={85}
            priority
            className="hero-img"
          />
        </div>
      </section>

      {/* PROOF BAR */}
      <div className="proof-bar">
        <div className="proof-inner">
          <div className="proof-item">
            <div className="proof-num">95,9%</div>
            <div className="proof-lbl">Taxa de comparecimento com confirmação automática</div>
          </div>
          <div className="proof-sep"></div>
          <div className="proof-item">
            <div className="proof-num">50%</div>
            <div className="proof-lbl">Redução média de faltas</div>
          </div>
          <div className="proof-sep"></div>
          <div className="proof-item">
            <div className="proof-num">3h</div>
            <div className="proof-lbl">Economizadas por dia em confirmações manuais</div>
          </div>
        </div>
        <p className="proof-note">*Dados reais de clínicas ativas na plataforma</p>
      </div>

      {/* PROBLEMA */}
      <section className="sec-features" id="problema">
        <div className="sec-hd" style={{ textAlign: 'center' }}>
          <h2 className="display-title">{data.problemTitle}</h2>
        </div>
        <div className="sp-problems">
          {data.problems.map((p, i) => (
            <div key={i} className="sp-problem-card">
              <div className="sp-problem-num">{String(i + 1).padStart(2, '0')}</div>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOLUCAO */}
      <section className="sec-product" id="solucao">
        <div className="sec-hd" style={{ textAlign: 'center' }}>
          <h2 className="display-title">{data.solutionTitle}</h2>
          <p className="sec-sub">{data.solutionSub}</p>
        </div>
        <div className="sp-features-grid">
          {data.features.map((f, i) => (
            <div key={i} className="sp-feature-card">
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFICIOS / WHATSAPP */}
      <section className="sp-demo-section" id="beneficios">
        <div className="sp-demo-inner">
          <div className="sp-demo-text">
            <h2 className="display-title">{data.reasonsTitle}</h2>
            <div className="sp-reasons">
              {data.reasons.map((r, i) => (
                <div key={i} className="sp-reason">
                  <div className="sp-reason-dot"></div>
                  <div>
                    <strong>{r.title}</strong>
                    <span> — {r.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="sp-demo-phone">
            <div className="sp-phone">
              <div className="sp-phone-header">
                <div className="sp-phone-name">{data.whatsapp.clinicName}</div>
                <div className="sp-phone-status">Online</div>
              </div>
              <div className="sp-phone-msgs">
                <div className="chat-bubble chat-in">{data.whatsapp.messageIn}<span className="chat-time">08:00</span></div>
                <div className="chat-bubble chat-out">{data.whatsapp.messageOut}<span className="chat-time">08:05</span></div>
                <div className="chat-bubble chat-in">{data.whatsapp.messageReply}<span className="chat-time">08:05</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="sec-testimonials">
        <div className="sec-hd" style={{ textAlign: 'center' }}>
          <h2 className="display-title">Quem usa, recomenda.</h2>
        </div>
        <div className="testimonials-grid">
          {data.testimonials.map((t, i) => (
            <div key={i} className="testimonial-card">
              <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
              <div className="testimonial-author">
                <Image
                  src={t.photo}
                  alt={t.name}
                  width={48}
                  height={48}
                  className="testimonial-photo"
                />
                <div className="testimonial-info">
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role} · {t.clinic}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <PricingSection lng={lng} />

      {/* FAQ */}
      <section className="sec-faq">
        <div className="sec-hd" style={{ textAlign: 'center' }}>
          <h2 className="display-title">Perguntas frequentes</h2>
        </div>
        <div className="faq-grid">
          {data.faqs.map((f, i) => (
            <details key={i} className="faq-item">
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <CtaSection lng={lng} />

      {/* FOOTER */}
      <LandingFooter />
    </div>
  )
}
