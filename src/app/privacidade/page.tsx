export const metadata = {
  title: "Política de Privacidade - Entenda o Documento",
  description: "Política de privacidade do aplicativo Entenda o Documento.",
};

const sectionTitleStyle = { marginTop: "20px", marginBottom: "6px" } as const;

export default function PrivacidadePage() {
  return (
    <main
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      style={{
        padding: "32px",
        fontFamily: "Arial, sans-serif",
        color: "#111111",
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
        lineHeight: 1.6,
      }}
    >
      <section aria-label="Política de Privacidade">
        <style>{`main, main * { color: #000000 !important; }`}</style>
        <h1 style={{ margin: 0 }}>Política de Privacidade</h1>
        <p style={{ marginTop: "8px" }}>
          Última atualização: 5 de fevereiro de 2026
        </p>

        <h2 style={sectionTitleStyle}>1. Introdução</h2>
        <p>
          Bem-vindo ao Entenda o Documento. Esta Política de Privacidade descreve como coletamos,
          usamos, armazenamos e protegemos suas informações ao usar nosso aplicativo móvel disponível
          na Apple Store e Google Play.
        </p>

        <h2 style={sectionTitleStyle}>2. Desenvolvedor</h2>
        <p><strong>Nome:</strong> Rafael (pessoa física)</p>
        <p><strong>Endereço:</strong> Brasil</p>
        <p><strong>Email:</strong> raferbati@hotmail.com</p>
        <p><strong>Website:</strong> https://entenda-o-documento.vercel.app</p>

        <h2 style={sectionTitleStyle}>3. Informações que Coletamos</h2>
        <h3 style={{ marginTop: "12px" }}>3.1. Fotos de Documentos</h3>
        <ul style={{ paddingLeft: "18px" }}>
          <li>O que coletamos: imagens de documentos capturadas ou selecionadas da galeria</li>
          <li>Propósito: análise por IA para fornecer explicações</li>
          <li>Duração: processamento temporário, sem armazenamento permanente</li>
          <li>Base legal (LGPD): legítimo interesse / consentimento ao usar o app</li>
        </ul>

        <h3 style={{ marginTop: "12px" }}>3.2. Texto Extraído</h3>
        <ul style={{ paddingLeft: "18px" }}>
          <li>O que coletamos: texto extraído das imagens via OCR</li>
          <li>Propósito: análise e geração de explicações</li>
          <li>Duração: processamento temporário durante a sessão</li>
          <li>Proteção: dados sensíveis são redatados na interface</li>
        </ul>

        <h3 style={{ marginTop: "12px" }}>3.3. Dados que Não Coletamos</h3>
        <ul style={{ paddingLeft: "18px" }}>
          <li>Informações pessoais (nome, email, telefone)</li>
          <li>Localização geográfica</li>
          <li>Histórico de navegação</li>
          <li>Lista de contatos</li>
          <li>Dados financeiros ou de pagamento</li>
        </ul>

        <h2 style={sectionTitleStyle}>4. Como Usamos Suas Informações</h2>
        <p>
          As fotos enviadas são transmitidas via HTTPS ao nosso servidor, processadas por serviços de
          IA (Google Gemini), analisadas para extrair informações relevantes e convertidas em
          explicações em português simples. As imagens são removidas após o processamento.
        </p>

        <h2 style={sectionTitleStyle}>5. Compartilhamento de Informações</h2>
        <p>
          Compartilhamos fotos e texto com o Google Gemini para análise de documentos. O provedor
          processa os dados conforme sua política: https://policies.google.com/privacy
        </p>

        <h2 style={sectionTitleStyle}>6. Segurança dos Dados</h2>
        <ul style={{ paddingLeft: "18px" }}>
          <li>Criptografia em trânsito (HTTPS/TLS)</li>
          <li>Redação automática de dados sensíveis na interface</li>
          <li>Processamento temporário sem armazenamento permanente</li>
          <li>Logs técnicos para diagnóstico e segurança</li>
        </ul>

        <h2 style={sectionTitleStyle}>7. Seus Direitos (LGPD)</h2>
        <p>
          Você pode solicitar acesso, correção, exclusão, portabilidade e informações sobre o
          tratamento de dados. Para exercer seus direitos, contate: raferbati@hotmail.com
        </p>

        <h2 style={sectionTitleStyle}>8. Retenção de Dados</h2>
        <ul style={{ paddingLeft: "18px" }}>
          <li>Fotos de documentos: não armazenadas após processamento</li>
          <li>Resultados: armazenados localmente (IndexedDB/sessionStorage) e removidos ao limpar o cache ou fechar a sessão</li>
          <li>Logs do servidor: até 90 dias (podem incluir IP, status e latência)</li>
          <li>Feedback agregado: contadores diários em Redis/Upstash</li>
          <li>Telemetria (se ativada): eventos via PostHog, sem conteúdo do documento</li>
        </ul>

        <h2 style={sectionTitleStyle}>9. Transferência Internacional</h2>
        <p>
          Seus dados podem ser processados fora do Brasil, incluindo Estados Unidos, conforme as
          salvaguardas da LGPD.
        </p>

        <h2 style={sectionTitleStyle}>10. Menores de Idade</h2>
        <p>
          Este aplicativo não é destinado a menores de 13 anos. Não coletamos conscientemente dados
          de crianças.
        </p>

        <h2 style={sectionTitleStyle}>11. Tecnologias de Rastreamento</h2>
        <ul style={{ paddingLeft: "18px" }}>
          <li>Armazenamento local para cache (IndexedDB/sessionStorage)</li>
          <li>Dados técnicos mínimos para operação (tokens temporários)</li>
          <li>Não usamos cookies de rastreamento de terceiros</li>
        </ul>

        <h2 style={sectionTitleStyle}>12. Atualizações</h2>
        <p>
          Podemos atualizar esta política periodicamente. Recomendamos revisá-la com frequência.
        </p>

        <h2 style={sectionTitleStyle}>13. Legislação Aplicável</h2>
        <p>
          Esta política é regida pelas leis do Brasil, incluindo LGPD, Marco Civil da Internet e Código
          de Defesa do Consumidor.
        </p>

        <h2 style={sectionTitleStyle}>14. Contato</h2>
        <p>
          Dúvidas sobre privacidade: raferbati@hotmail.com (prazo de resposta: até 5 dias úteis)
        </p>

        <h2 style={sectionTitleStyle}>15. Consentimento</h2>
        <p>
          Ao usar o aplicativo, você concorda com esta Política de Privacidade. Se não concordar, não
          use o aplicativo.
        </p>
      </section>
    </main>
  );
}
