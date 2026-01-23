export type FriendlyError = {
  title: string;
  message: string;
  hint?: string;
  actionLabel?: string;
  actionHref?: string;
};

function parseRetryAfterSeconds(res: Response) {
  const v = res.headers.get("Retry-After");
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : null;
}

export function buildAnalyzeFriendlyError(res: Response | null, data: any): FriendlyError {
  const apiMsg = typeof data?.error === "string" ? data.error : "";
  const status = res?.status ?? 0;

  if (status === 401)
    return {
      title: "Sessão expirada",
      message: "O tempo da sua sessão acabou.",
      hint: "Tire outra foto para continuar.",
      actionLabel: "Tirar nova foto",
      actionHref: "/camera",
    };

  if (status === 410)
    return {
      title: "A foto expirou",
      message: "Por segurança, a foto foi apagada.",
      hint: "Tire outra foto.",
      actionLabel: "Tirar nova foto",
      actionHref: "/camera",
    };
  if (status === 413)
    return {
      title: "Foto muito pesada",
      message: "A imagem ficou grande demais.",
      hint: "Tente aproximar o documento.",
      actionLabel: "Tirar outra foto",
      actionHref: "/camera",
    };
  if (status === 429) {
    const retry = res ? parseRetryAfterSeconds(res) : null;
    return {
      title: "Muitas tentativas",
      message: retry ? `Aguarde ${retry}s.` : "Aguarde um pouco.",
      hint: "Sua internet pode estar oscilando.",
      actionLabel: "Voltar",
      actionHref: "/camera",
    };
  }

  return {
    title: "Não entendi a foto",
    message: apiMsg || "Ocorreu um problema.",
    hint: "Tente com mais luz.",
    actionLabel: "Tentar outra foto",
    actionHref: "/camera",
  };
}

export function mapCaptureError(status: number, apiError: string) {
  if (status === 401) return "Sessão expirada. Tire outra foto para continuar.";
  if (status === 403) return "Não foi possível validar a solicitação. Tente novamente.";
  if (status === 413) return "Foto muito grande. Aproxime o documento e tente novamente.";
  if (status === 429) return "Muitas tentativas. Aguarde um pouco.";
  if (status >= 500) return "Erro interno. Tente novamente.";

  switch (apiError) {
    case "Requisição inválida.":
      return "Não conseguimos enviar a foto. Tente novamente.";
    case "Imagem inválida.":
      return "A foto não pôde ser lida. Tente outra foto.";
    case "Imagem não informada.":
      return "Nenhuma foto foi enviada. Tente novamente.";
    case "Base64 inválido.":
      return "Falha ao preparar a foto. Tente outra foto.";
    case "Tipo de imagem não suportado. Use JPG, PNG ou WebP.":
      return "Formato não suportado. Use JPG, PNG ou WebP.";
    case "Tipo de imagem inválido.":
      return "Formato da foto inválido. Tente outra foto.";
    case "O sistema está temporariamente ocupado. Tente novamente em alguns minutos.":
      return "Sistema ocupado no momento. Tente em alguns minutos.";
    case "O sistema está temporariamente cheio. Tente novamente em instantes.":
      return "Sistema cheio no momento. Tente novamente em instantes.";
    default:
      return apiError || "Falha ao enviar imagem";
  }
}

export function mapQaError(status: number, apiError: string) {
  if (status === 401) return "Sessão expirada. Refaça a análise do documento.";
  if (status === 403) return "Não foi possível validar a solicitação. Tente novamente.";
  if (status === 429) return "Muitas tentativas. Aguarde um pouco.";
  if (status === 502) return "Não conseguimos gerar a resposta agora. Tente novamente.";
  if (status >= 500) return "Erro interno. Tente novamente.";

  switch (apiError) {
    case "Requisição inválida.":
      return "Não conseguimos enviar sua pergunta. Tente novamente.";
    case "Pergunta muito curta.":
      return "Sua pergunta é muito curta.";
    case "Pergunta longa demais.":
      return "Sua pergunta é muito longa.";
    case "Contexto do documento não informado.":
      return "Não conseguimos encontrar o conteúdo do documento.";
    case "Contexto muito longo.":
      return "O conteúdo do documento ficou muito grande para responder.";
    default:
      return apiError || "Não foi possível responder agora.";
  }
}

export function mapFeedbackError(status: number, apiError: string) {
  if (status === 401) return "Sessão expirada. Refaça a análise para enviar feedback.";
  if (status === 403) return "Não foi possível validar a solicitação. Tente novamente.";
  if (status === 429) return "Muitas tentativas. Aguarde um pouco.";
  if (status >= 500) return "Erro interno. Tente novamente.";

  switch (apiError) {
    case "Requisição inválida.":
      return "Não conseguimos enviar seu feedback. Tente novamente.";
    case "Feedback inválido.":
      return "Feedback inválido. Tente novamente.";
    default:
      return apiError || "Não foi possível enviar feedback.";
  }
}

export function mapNetworkError(message: string) {
  if (!message) return "Falha de conexão. Verifique sua internet e tente novamente.";
  if (/load failed/i.test(message) || /failed to fetch/i.test(message)) {
    return "Falha de conexão. Verifique sua internet e tente novamente.";
  }
  return message;
}
