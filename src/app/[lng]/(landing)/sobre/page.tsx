import Link from 'next/link'
import { LandingFooter } from '../landing-footer'
import '../landing.css'

export default function SobrePage() {
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

      <main className="about-page">
        <div className="about-container">
          <h1 className="about-title">Sobre o Aseno</h1>
          <p className="about-subtitle">
            Simplificamos a gestão de agendamentos para que você possa focar no que realmente importa: cuidar dos seus pacientes.
          </p>

          <section className="about-section">
            <h2>Nossa Missão</h2>
            <p>
              O Aseno nasceu com um objetivo claro: eliminar a dor de cabeça da gestão de agendamentos em clínicas de saúde e estética. Sabemos que profissionais da saúde perdem horas preciosas por semana lidando com confirmações, reagendamentos e no-shows.
            </p>
            <p>
              Nossa plataforma utiliza automação inteligente e integração com WhatsApp para transformar a maneira como clínicas gerenciam suas agendas, reduzindo faltas em até 50% e liberando tempo para o que realmente importa.
            </p>
          </section>

          <section className="about-section">
            <h2>O que nos move</h2>
            <p>
              Acreditamos que a tecnologia deve servir as pessoas, não complicar suas vidas. Por isso, criamos uma ferramenta intuitiva que se adapta ao fluxo de trabalho da sua clínica, e não o contrário.
            </p>
          </section>

          <section className="about-section">
            <h2>Nossos Valores</h2>
            <div className="about-values">
              <div className="about-value">
                <div className="about-value-icon">💡</div>
                <h3>Simplicidade</h3>
                <p>Tecnologia poderosa com interface intuitiva. Sem complicação, sem curva de aprendizado.</p>
              </div>
              <div className="about-value">
                <div className="about-value-icon">🤝</div>
                <h3>Confiança</h3>
                <p>Seus dados e os dos seus pacientes são tratados com o máximo de segurança e privacidade.</p>
              </div>
              <div className="about-value">
                <div className="about-value-icon">🚀</div>
                <h3>Inovação</h3>
                <p>Automação com IA e integrações inteligentes que evoluem constantemente para melhor atendê-lo.</p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Para quem é o Aseno</h2>
            <p>
              O Aseno é ideal para clínicas de estética, fisioterapia, psicologia, odontologia e outros profissionais de saúde que desejam modernizar sua gestão de agendamentos e reduzir faltas com automação via WhatsApp.
            </p>
            <p>
              Seja uma clínica com um único profissional ou uma equipe de dezenas, temos um plano que se adapta às suas necessidades.
            </p>
          </section>

          <section className="about-section">
            <h2>Entre em contato</h2>
            <p>
              Quer saber mais sobre como o Aseno pode ajudar sua clínica? <Link href="/contato" className="legal-link">Fale conosco</Link> ou <Link href="/register" className="legal-link">comece seu teste gratuito</Link> agora mesmo.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
