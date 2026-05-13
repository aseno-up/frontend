import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingFooter } from '../landing-footer'
import '../landing.css'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Aseno — Sistema de Agendamento para Clínicas',
  description: 'Saiba como o Aseno coleta, utiliza e protege seus dados pessoais. Política de privacidade em conformidade com a LGPD.',
}

export default function PrivacidadePage() {
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
          <h1 className="legal-title">Política de Privacidade</h1>
          <p className="legal-updated">Ultima atualização: 24 de março de 2026</p>

          <section className="legal-section">
            <h2>1. Introdução</h2>
            <p>
              A presente Política de Privacidade descreve como o Aseno ("nós", "nosso") coleta, utiliza, armazena e protege os dados pessoais dos usuários da plataforma, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Dados que Coletamos</h2>
            <p>Coletamos os seguintes tipos de dados:</p>

            <h3>2.1 Dados fornecidos por você</h3>
            <ul>
              <li>Nome completo e dados de identificação</li>
              <li>Endereço de e-mail e telefone</li>
              <li>CPF ou CNPJ (para fins de cobrança)</li>
              <li>Nome e informações da clínica</li>
              <li>Dados de pacientes cadastrados na plataforma</li>
            </ul>

            <h3>2.2 Dados coletados automaticamente</h3>
            <ul>
              <li>Endereço IP e informações do navegador</li>
              <li>Dados de uso e navegação na plataforma</li>
              <li>Cookies e tecnologias similares</li>
              <li>Informações do dispositivo (tipo, sistema operacional)</li>
            </ul>

            <h3>2.3 Dados de terceiros</h3>
            <ul>
              <li>Informações de autenticação via Google (quando utilizado login social)</li>
              <li>Dados de integração com Google Calendar</li>
              <li>Dados de interação via WhatsApp Business API</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Como Utilizamos seus Dados</h2>
            <p>Utilizamos os dados pessoais para as seguintes finalidades:</p>
            <ul>
              <li>Prestação e manutenção dos serviços da plataforma</li>
              <li>Criação e gerenciamento de sua conta</li>
              <li>Processamento de pagamentos e emissão de notas fiscais</li>
              <li>Envio de confirmações e lembretes de agendamentos via WhatsApp</li>
              <li>Comunicações sobre atualizações, novidades e suporte</li>
              <li>Melhoria contínua da plataforma e experiência do usuário</li>
              <li>Cumprimento de obrigações legais e regulatórias</li>
              <li>Prevenção de fraudes e segurança da plataforma</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Base Legal para o Tratamento</h2>
            <p>O tratamento dos dados pessoais é realizado com base nas seguintes hipóteses legais da LGPD:</p>
            <ul>
              <li><strong>Consentimento:</strong> quando você aceita os termos e fornece seus dados voluntariamente</li>
              <li><strong>Execução de contrato:</strong> para a prestação dos serviços contratados</li>
              <li><strong>Legítimo interesse:</strong> para melhoria dos serviços e comunicações relevantes</li>
              <li><strong>Obrigação legal:</strong> para cumprimento de exigências legais e fiscais</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Compartilhamento de Dados</h2>
            <p>
              Seus dados pessoais podem ser compartilhados com terceiros apenas nas seguintes situações:
            </p>
            <ul>
              <li><strong>Processadores de pagamento:</strong> para efetuar cobranças e transações financeiras</li>
              <li><strong>Provedores de infraestrutura:</strong> serviços de hospedagem e armazenamento em nuvem</li>
              <li><strong>WhatsApp Business API:</strong> para envio de mensagens automatizadas</li>
              <li><strong>Google:</strong> para integração com Calendar e autenticação</li>
              <li><strong>Autoridades legais:</strong> quando exigido por lei ou ordem judicial</li>
            </ul>
            <p>
              Não vendemos, alugamos ou comercializamos seus dados pessoais para terceiros.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Armazenamento e Segurança</h2>
            <p>
              Seus dados são armazenados em servidores seguros com criptografia em trânsito e em repouso. Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda, destruição ou alteração.
            </p>
            <p>As medidas de segurança incluem:</p>
            <ul>
              <li>Criptografia TLS/SSL para dados em trânsito</li>
              <li>Criptografia AES-256 para dados em repouso</li>
              <li>Controle de acesso baseado em papéis (RBAC)</li>
              <li>Monitoramento contínuo e logs de auditoria</li>
              <li>Backups regulares e plano de recuperação de desastres</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Retenção de Dados</h2>
            <p>
              Seus dados pessoais são mantidos pelo período necessário para a prestação dos serviços e cumprimento de obrigações legais. Após o encerramento da conta:
            </p>
            <ul>
              <li>Dados de pacientes e agendamentos: mantidos por 5 anos conforme regulamentação de saúde</li>
              <li>Dados fiscais e de pagamento: mantidos por 5 anos conforme legislação tributária</li>
              <li>Dados de conta e perfil: excluídos em até 30 dias após solicitação</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>8. Seus Direitos (LGPD)</h2>
            <p>Como titular dos dados, você tem o direito de:</p>
            <ul>
              <li><strong>Confirmação e acesso:</strong> saber se seus dados são tratados e acessá-los</li>
              <li><strong>Correção:</strong> solicitar a correção de dados incompletos ou desatualizados</li>
              <li><strong>Anonimização ou eliminação:</strong> solicitar a anonimização ou exclusão de dados desnecessários</li>
              <li><strong>Portabilidade:</strong> solicitar a transferência de seus dados para outro fornecedor</li>
              <li><strong>Informação sobre compartilhamento:</strong> saber com quais terceiros seus dados são compartilhados</li>
              <li><strong>Revogação do consentimento:</strong> revogar o consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> opor-se ao tratamento em caso de descumprimento da LGPD</li>
            </ul>
            <p>
              Para exercer seus direitos, entre em contato conosco através da <Link href="/contato" className="legal-link">página de contato</Link> ou pelo e-mail: <a href="mailto:contato@aseno.com.br" className="legal-link">contato@aseno.com.br</a>.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Cookies</h2>
            <p>
              Utilizamos cookies divididos em duas categorias. Você decide quais aceitar no banner exibido na sua primeira visita e pode revisar sua escolha a qualquer momento pelo link <strong>&ldquo;Configurações de cookies&rdquo;</strong> no rodapé.
            </p>
            <h3>Cookies essenciais (sempre ativos)</h3>
            <p>
              Indispensáveis para o funcionamento do site e da plataforma. Não exigem consentimento conforme o Guia de Cookies da ANPD:
            </p>
            <ul>
              <li><strong>Autenticação:</strong> mantêm sua sessão ativa após o login</li>
              <li><strong>Preferências:</strong> idioma e configurações da interface</li>
              <li><strong>Segurança:</strong> proteção contra ataques (CSRF, fixação de sessão)</li>
              <li><strong>Registro de consentimento:</strong> guardam sua escolha sobre os cookies não-essenciais</li>
            </ul>
            <h3>Cookies de análise e marketing (opt-in)</h3>
            <p>
              Só são definidos se você clicar em <strong>&ldquo;Aceitar todos&rdquo;</strong> no banner. Se preferir <strong>&ldquo;Apenas essenciais&rdquo;</strong>, estes cookies não são gravados:
            </p>
            <ul>
              <li><strong>Google Analytics:</strong> entender como você navega no site (páginas vistas, tempo, fluxo)</li>
              <li><strong>Google Tag Manager:</strong> gerenciamento centralizado das tags de marketing</li>
              <li><strong>Google Ads:</strong> medir conversões de campanhas de anúncios</li>
              <li><strong>Meta Pixel (Facebook):</strong> mensurar conversões e formar audiências para campanhas no Facebook e Instagram</li>
            </ul>
            <p>
              Você pode revogar o consentimento a qualquer momento pelo link <strong>&ldquo;Configurações de cookies&rdquo;</strong>. Ao revogar, novos cookies não-essenciais deixam de ser definidos; cookies já existentes podem ser apagados pelas configurações do seu navegador.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Dados de Pacientes</h2>
            <p>
              Entendemos que os dados de pacientes inseridos na plataforma são sensíveis. O Aseno atua como operador desses dados, sendo a clínica o controlador. Não acessamos, utilizamos ou compartilhamos dados de pacientes para qualquer finalidade além da prestação dos serviços contratados.
            </p>
            <p>
              A clínica é responsável por obter o consentimento adequado de seus pacientes para o tratamento de dados na plataforma.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Alterações nesta Política</h2>
            <p>
              Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos sobre alterações significativas através da plataforma ou por e-mail. Recomendamos que você revise esta política regularmente.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Contato e Encarregado de Dados (DPO)</h2>
            <p>
              Para questões relacionadas à privacidade e proteção de dados, entre em contato:
            </p>
            <ul>
              <li>E-mail: <a href="mailto:contato@aseno.com.br" className="legal-link">contato@aseno.com.br</a></li>
              <li><Link href="/contato" className="legal-link">Página de contato</Link></li>
            </ul>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
