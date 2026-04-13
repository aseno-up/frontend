import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="ft-grid">
        <div className="ft-brand">
          <Link href="/" className="ft-logo">aseno<span>.</span></Link>
          <p>Sistema de agendamento inteligente para profissionais e clínicas que agendam sessões.</p>
        </div>
        <div className="ft-col">
          <h4>Produto</h4>
          <ul>
            <li><a href="/#recursos">Recursos</a></li>
            <li><a href="/#precos">Preços</a></li>
            <li><Link href="/integracoes">Integrações</Link></li>
          </ul>
        </div>
        <div className="ft-col">
          <h4>Empresa</h4>
          <ul>
            <li><Link href="/sobre">Sobre</Link></li>
            <li><Link href="/contato">Contato</Link></li>
            <li><a href="https://blog.aseno.com.br/" target="_blank">Blog</a></li>
          </ul>
        </div>
        <div className="ft-col">
          <h4>Legal</h4>
          <ul>
            <li><Link href="/termos">Termos de uso</Link></li>
            <li><Link href="/privacidade">Privacidade</Link></li>
          </ul>
        </div>
      </div>
      <div className="ft-bottom">
        <span>© 2026 Aseno. Todos os direitos reservados.</span>
        <span>Feito para quem cuida.</span>
      </div>
    </footer>
  )
}
