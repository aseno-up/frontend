import type { Metadata } from 'next'
import Link from 'next/link'
import { KitPlanilhasForm, ScrollToFormLink } from './kit-planilhas-form'
import '../landing.css'
import './kit-planilhas.css'

export const metadata: Metadata = {
  title: 'Kit de Planilhas para Clínicas — Grátis | Aseno',
  description: '3 planilhas prontas para controlar agenda, no-show, financeiro e precificação da sua clínica. Baixe grátis.',
}

function CheckIcon() {
  return (
    <div className="kp-check">
      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
    </div>
  )
}

export default function KitPlanilhasPage() {
  return (
    <div className="kp-body">
      {/* NAV */}
      <nav className="kp-nav">
        <Link href="/" className="kp-logo">
          aseno<span className="kp-logo-dot" />
        </Link>
        <ScrollToFormLink className="kp-nav-cta">Quero as planilhas</ScrollToFormLink>
      </nav>

      {/* HERO */}
      <section className="kp-hero">
        <div className="kp-hero-inner">
          <div className="kp-hero-left">
            <div className="kp-badge">Kit gratuito para clínicas</div>
            <h1>Você sabe quanto perdeu<br/>esse mês com <em>no-show?</em></h1>
            <p className="kp-hero-sub">
              A maioria dos donos de clínica <strong>não sabe</strong> — e é exatamente por isso que continuam perdendo. Baixe grátis o kit com 3 planilhas prontas para <strong>mapear, controlar e recuperar</strong> a receita da sua clínica.
            </p>
            <div className="kp-social-proof">
              <div className="kp-avatars">
                <div className="kp-av kp-av-1">AM</div>
                <div className="kp-av kp-av-2">KF</div>
                <div className="kp-av kp-av-3">RP</div>
                <div className="kp-av kp-av-4">LC</div>
              </div>
              <span><strong>+320 profissionais</strong> baixaram este kit essa semana</span>
            </div>
          </div>

          <div id="kp-form">
            <div className="kp-form-card">
              <div className="kp-kit-preview">
                <div className="kp-kit-item">
                  <div className="kp-kit-icon">
                    <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                  Controle de Agenda &amp; No-Show
                </div>
                <div className="kp-kit-item">
                  <div className="kp-kit-icon">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  </div>
                  Controle Financeiro &amp; Repasse
                </div>
                <div className="kp-kit-item">
                  <div className="kp-kit-icon">
                    <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                  </div>
                  Calculadora de Precificação
                </div>
              </div>
              <KitPlanilhasForm />
            </div>
          </div>
        </div>
      </section>

      {/* O QUE ESTA NO KIT */}
      <section className="kp-section">
        <div className="kp-section-inner">
          <p className="kp-section-label">O que está no kit</p>
          <h2>3 planilhas que resolvem <em>dores reais</em> de clínica</h2>
          <p className="kp-section-desc">Cada planilha foi criada para atacar um problema específico que drena receita — e que a maioria das clínicas ainda controla no Excel bagunçado ou no caderno.</p>

          <div className="kp-planilhas-grid">
            <div className="kp-planilha-card">
              <div className="kp-planilha-num">01</div>
              <h3>Controle de Agenda &amp; No-Show</h3>
              <p>Registre cada consulta, acompanhe status em tempo real e veja exatamente quanto você perdeu com pacientes que não apareceram.</p>
              <ul className="kp-planilha-features">
                <li><CheckIcon />Dashboard automático de no-show</li>
                <li><CheckIcon />Receita perdida calculada</li>
                <li><CheckIcon />Alerta quando meta é ultrapassada</li>
                <li><CheckIcon />Controle de confirmação via WhatsApp</li>
              </ul>
            </div>

            <div className="kp-planilha-card">
              <div className="kp-planilha-num">02</div>
              <h3>Controle Financeiro &amp; Repasse</h3>
              <p>Registre todas as receitas, calcule automaticamente o repasse de cada profissional e rastreie os pagamentos em aberto.</p>
              <ul className="kp-planilha-features">
                <li><CheckIcon />Repasse automático por profissional</li>
                <li><CheckIcon />Resultado operacional mensal</li>
                <li><CheckIcon />Aba de inadimplência com dias de atraso</li>
                <li><CheckIcon />Receita líquida vs. custos fixos</li>
              </ul>
            </div>

            <div className="kp-planilha-card">
              <div className="kp-planilha-num">03</div>
              <h3>Calculadora de Precificação</h3>
              <p>Descubra o preço mínimo de cada procedimento para não trabalhar no prejuízo — e o preço sugerido com a margem que você quer.</p>
              <ul className="kp-planilha-features">
                <li><CheckIcon />Preço mínimo por procedimento</li>
                <li><CheckIcon />Custo fixo rateado por sessão</li>
                <li><CheckIcon />Repasse do profissional já incluído</li>
                <li><CheckIcon />Comparação com preço de mercado</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="kp-stats-section">
        <div className="kp-stats-inner">
          <div>
            <div className="kp-stat-val">28<span>%</span></div>
            <div className="kp-stat-lbl">é a taxa média de no-show em clínicas sem sistema de confirmação</div>
          </div>
          <div>
            <div className="kp-stat-val">R$<span>3k</span></div>
            <div className="kp-stat-lbl">de receita perdida por mês em média por no-show em clínicas de médio porte</div>
          </div>
          <div>
            <div className="kp-stat-val">6<span>x</span></div>
            <div className="kp-stat-lbl">mais difícil recuperar um lead perdido do que manter o paciente confirmado</div>
          </div>
          <div>
            <div className="kp-stat-val"><span>&#8595;</span>73<span>%</span></div>
            <div className="kp-stat-lbl">de redução de no-show com confirmação ativa via WhatsApp</div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="kp-section kp-como-section">
        <div className="kp-section-inner">
          <p className="kp-section-label">Como funciona</p>
          <h2>Simples assim — <em>3 passos</em></h2>
          <div className="kp-passos">
            <div className="kp-passo">
              <div className="kp-passo-num">1</div>
              <h3>Preencha o formulário</h3>
              <p>Coloque seu nome, e-mail e WhatsApp. Sem cartão de crédito, sem cadastro complicado.</p>
            </div>
            <div className="kp-passo">
              <div className="kp-passo-num">2</div>
              <h3>Receba o kit no e-mail</h3>
              <p>Em instantes você recebe as 3 planilhas prontas para usar, com exemplos e instruções dentro de cada uma.</p>
            </div>
            <div className="kp-passo">
              <div className="kp-passo-num">3</div>
              <h3>Comece a usar hoje</h3>
              <p>Abra no Google Sheets ou Excel, configure com os dados da sua clínica e veja os números que estavam escondidos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="kp-cta-final">
        <div className="kp-cta-inner">
          <h2>Pare de adivinhar.<br /><em>Comece a controlar.</em></h2>
          <p>Sua concorrência já sabe onde está perdendo dinheiro. O kit é gratuito — a única coisa que custa é continuar sem ele.</p>
          <ScrollToFormLink className="kp-btn-cta-lg">
            Baixar kit grátis agora
            <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </ScrollToFormLink>
          <p className="kp-cta-disclaimer">Grátis. Cancele quando quiser.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="kp-footer">
        <div className="kp-footer-logo">aseno</div>
        <p className="kp-footer-txt">© 2026 Aseno. Software de gestão para clínicas. aseno.com.br</p>
        <div className="kp-footer-links">
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
          <a href="https://aseno.com.br">Site</a>
        </div>
      </footer>
    </div>
  )
}
