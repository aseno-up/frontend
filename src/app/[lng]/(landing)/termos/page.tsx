import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingFooter } from '../landing-footer'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Termos de Uso | Aseno — Sistema de Agendamento para Clínicas',
  description: 'Termos e condições de uso da plataforma Aseno. Leia sobre responsabilidades, pagamentos, propriedade intelectual e proteção de dados.',
}

export default function TermosPage() {
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

      <main className="legal-page">
        <div className="legal-container">
          <h1 className="legal-title">Termos de Uso</h1>
          <p className="legal-updated">Ultima atualização: 24 de março de 2026</p>

          <section className="legal-section">
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou utilizar a plataforma Aseno ("Plataforma"), você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concorda com algum destes termos, não utilize a Plataforma.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Descrição do Serviço</h2>
            <p>
              O Aseno é uma plataforma de agendamento inteligente voltada para clínicas de estética, fisioterapia e saúde em geral. O serviço inclui, mas não se limita a:
            </p>
            <ul>
              <li>Gestão de agendamentos e agenda de profissionais</li>
              <li>Confirmação automática de consultas via WhatsApp</li>
              <li>Gestão de pacientes e prontuários</li>
              <li>Relatórios e análises de desempenho</li>
              <li>Integração com Google Calendar e outros serviços</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Cadastro e Conta</h2>
            <p>
              Para utilizar a Plataforma, é necessário criar uma conta fornecendo informações verdadeiras, completas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
            </p>
            <p>
              Você se compromete a notificar o Aseno imediatamente sobre qualquer uso não autorizado de sua conta ou qualquer outra violação de segurança.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Planos e Pagamentos</h2>
            <p>
              O Aseno oferece diferentes planos de assinatura, incluindo um período de teste gratuito. Os valores, funcionalidades e limites de cada plano estão descritos na página de preços da Plataforma.
            </p>
            <p>
              As cobranças são realizadas de forma recorrente (mensal ou anual), conforme o plano escolhido. O cancelamento pode ser feito a qualquer momento, e o acesso será mantido até o final do período já pago.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Uso Aceitável</h2>
            <p>Ao utilizar a Plataforma, você concorda em não:</p>
            <ul>
              <li>Utilizar o serviço para fins ilegais ou não autorizados</li>
              <li>Tentar acessar áreas restritas da Plataforma sem autorização</li>
              <li>Transmitir vírus, malware ou qualquer código malicioso</li>
              <li>Interferir ou interromper a integridade ou desempenho da Plataforma</li>
              <li>Coletar ou armazenar dados pessoais de outros usuários sem consentimento</li>
              <li>Revender ou redistribuir o acesso à Plataforma sem autorização</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo da Plataforma, incluindo textos, gráficos, logotipos, ícones, imagens, software e código-fonte, é de propriedade do Aseno ou de seus licenciadores e está protegido pelas leis de propriedade intelectual aplicáveis.
            </p>
            <p>
              Os dados inseridos por você na Plataforma (informações de pacientes, agendamentos, etc.) permanecem de sua propriedade. O Aseno não utilizará esses dados para fins que não sejam a prestação do serviço.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Limitação de Responsabilidade</h2>
            <p>
              A Plataforma é fornecida "como está". O Aseno não garante que o serviço será ininterrupto, livre de erros ou totalmente seguro. Em nenhuma hipótese o Aseno será responsável por danos indiretos, incidentais, especiais ou consequenciais decorrentes do uso da Plataforma.
            </p>
            <p>
              O Aseno não se responsabiliza por decisões clínicas ou médicas tomadas com base nas informações gerenciadas pela Plataforma.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Proteção de Dados</h2>
            <p>
              O tratamento de dados pessoais realizado pelo Aseno está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Para mais detalhes sobre como seus dados são coletados, utilizados e protegidos, consulte nossa <Link href="/privacidade" className="legal-link">Política de Privacidade</Link>.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Rescisão</h2>
            <p>
              O Aseno pode suspender ou encerrar sua conta caso haja violação destes Termos de Uso. Você também pode encerrar sua conta a qualquer momento entrando em contato conosco ou através das configurações da Plataforma.
            </p>
            <p>
              Após o encerramento, seus dados serão mantidos pelo período exigido por lei e, em seguida, serão excluídos de forma segura.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Alterações nos Termos</h2>
            <p>
              O Aseno reserva-se o direito de modificar estes Termos de Uso a qualquer momento. As alterações serão comunicadas através da Plataforma ou por e-mail. O uso continuado da Plataforma após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Legislação Aplicável</h2>
            <p>
              Estes Termos de Uso são regidos pela legislação brasileira. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer dúvidas ou controvérsias decorrentes destes Termos.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Contato</h2>
            <p>
              Em caso de dúvidas sobre estes Termos de Uso, entre em contato conosco através da nossa <Link href="/contato" className="legal-link">página de contato</Link> ou pelo e-mail: <a href="mailto:contato@aseno.com.br" className="legal-link">contato@aseno.com.br</a>.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
