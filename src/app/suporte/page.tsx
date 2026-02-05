export const metadata = {
  title: "Suporte - Entenda o Documento",
  description: "Canal de suporte e contato do aplicativo Entenda o Documento.",
};

export default function SuportePage() {
  return (
    <main
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="region"
      aria-label="Suporte"
      style={{
        padding: "32px",
        fontFamily: "Arial, sans-serif",
        color: "#111111",
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
      }}
    >
      <style>{`main, main * { color: #000000 !important; }`}</style>
      <h1 style={{ margin: 0 }}>Suporte</h1>
      <p style={{ marginTop: "12px" }}>
        Para dúvidas, suporte técnico ou solicitações relacionadas a privacidade, entre em contato:
      </p>
      <p style={{ marginTop: "8px" }}>
        <strong>Email:</strong> raferbati@hotmail.com
      </p>
      <p style={{ marginTop: "8px" }}>
        Informe no email:
      </p>
      <ul style={{ marginTop: "6px", paddingLeft: "18px" }}>
        <li>Modelo do aparelho e versão do Android</li>
        <li>Descrição do problema e passos para reproduzir</li>
        <li>Data e horário aproximado do ocorrido</li>
      </ul>
    </main>
  );
}
