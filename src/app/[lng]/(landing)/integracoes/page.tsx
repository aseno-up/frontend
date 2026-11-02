import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingFooter } from '../landing-footer'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Integrações | Aseno — Sistema de Agendamento para Clínicas',
  description: 'Conecte o Aseno ao WhatsApp, Google Calendar, pagamentos online e mais. Integrações que automatizam sua rotina clínica.',
}

const integrations = [
  {
    name: 'WhatsApp Business',
    description: 'Confirmações automáticas, lembretes e reagendamentos direto no WhatsApp dos seus pacientes. Reduza faltas em até 50% com mensagens inteligentes enviadas por IA.',
    icon: '💬',
    status: 'available' as const,
  },
  {
    name: 'Google Calendar',
    description: 'Sincronização bidirecional com o Google Calendar. Seus agendamentos aparecem automaticamente no calendário pessoal de cada profissional.',
    icon: '📅',
    status: 'available' as const,
  },
  {
    name: 'Agendamento Online',
    description: 'Link público de agendamento para seus pacientes marcarem consultas 24/7. Perfeito para compartilhar no Instagram, site ou Google Meu Negócio.',
    icon: '🔗',
    status: 'available' as const,
  },
  {
    name: 'Pagamentos Online',
    description: 'Receba pagamentos via PIX e Cartão de Crédito diretamente na conta da sua clínica. O paciente paga ao agendar e o dinheiro cai direto na sua conta — sem intermediários.',
    icon: '💳',
    status: 'available' as const,
  },
  {
    name: 'Venda de Pacotes ↔ Financeiro',
    description: 'Monte um orçamento, feche a venda em 1 clique e o Aseno gera as parcelas no financeiro automaticamente (PIX, cartão ou parcelado). Recibo no WhatsApp, baixa automática no caixa quando o pagamento cai e saldo de sessões consumido a cada agendamento.',
    icon: '🧾',
    status: 'available' as const,
  },
  {
    name: 'Google Meu Negócio',
    description: 'Botão "Agendar" direto na ficha da sua clínica no Google. Pacientes que encontram sua clínica na busca podem marcar consulta com um clique.',
    icon: '📍',
    status: 'soon' as const,
  },
  {
    name: 'Instagram',
    description: 'Link de agendamento otimizado para o botão de ação do Instagram. Transforme seguidores em pacientes com agendamento direto pelo perfil.',
    icon: '📸',
    status: 'soon' as const,
  },
  {
    name: 'Exportação Contábil',
    description: 'Exporte dados financeiros em CSV ou integre com Conta Azul e Omie. Facilite o trabalho do seu contador com relatórios prontos.',
    icon: '📊',
    status: 'soon' as const,
  },
]

export default function IntegracoesPage() {
  const available = integrations.filter(i => i.status === 'available')
  const soon = integrations.filter(i => i.status === 'soon')

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

      <main className="integrations-page">
        <div className="integrations-container">
          <div className="integrations-header">
            <span className="eyebrow">Integrações</span>
            <h1 className="integrations-title">Conecte o Aseno ao seu fluxo de trabalho</h1>
            <p className="integrations-subtitle">
              Integrações que automatizam sua rotina e conectam o Aseno às ferramentas que sua clínica já utiliza.
            </p>
          </div>

          <section className="integrations-section">
            <h2 className="integrations-section-title">
              Disponível
              <span className="integrations-count">{available.length}</span>
            </h2>
            <div className="integrations-grid">
              {available.map((integration) => (
                <div key={integration.name} className="integration-card">
                  <div className="integration-icon">{integration.icon}</div>
                  <div className="integration-content">
                    <div className="integration-header">
                      <h3>{integration.name}</h3>
                      <span className="integration-badge integration-badge-active">Ativo</span>
                    </div>
                    <p>{integration.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="integrations-section">
            <h2 className="integrations-section-title">
              Em breve
              <span className="integrations-count">{soon.length}</span>
            </h2>
            <div className="integrations-grid">
              {soon.map((integration) => (
                <div key={integration.name} className="integration-card integration-card-soon">
                  <div className="integration-icon">{integration.icon}</div>
                  <div className="integration-content">
                    <div className="integration-header">
                      <h3>{integration.name}</h3>
                      <span className="integration-badge integration-badge-soon">Em breve</span>
                    </div>
                    <p>{integration.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="integrations-cta">
            <h2>Não encontrou a integração que precisa?</h2>
            <p>Estamos sempre adicionando novas integrações. Conte para nós o que sua clínica precisa.</p>
            <Link href="/contato" className="btn-lg">Sugerir integração</Link>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
