import { describe, expect, it } from "vitest";
import {
  buildAnalyzeFriendlyError,
  mapCaptureError,
  mapFeedbackError,
  mapNetworkError,
  mapQaError,
} from "@/lib/errorMesages";


describe("errorMesages", () => {
  it("builds analyze error with retry-after", () => {
    const res = new Response(null, { status: 429, headers: { "Retry-After": "2" } });
    const result = buildAnalyzeFriendlyError(res, { error: "" });
    expect(result.title).toBe("Muitas tentativas");
    expect(result.message).toBe("Aguarde 2s.");
    expect(result.actionHref).toBe("/camera");
  });

  it("builds analyze error for session expired", () => {
    const res = new Response(null, { status: 401 });
    const result = buildAnalyzeFriendlyError(res, null);
    expect(result.title).toBe("Sessão expirada");
    expect(result.actionLabel).toBe("Tirar nova foto");
  });

  it("builds analyze error for expired photo and payload too large", () => {
    const expired = buildAnalyzeFriendlyError(new Response(null, { status: 410 }), null);
    expect(expired.title).toBe("Foto expirada");

    const tooLarge = buildAnalyzeFriendlyError(new Response(null, { status: 413 }), null);
    expect(tooLarge.title).toBe("Foto muito pesada");
  });

  it("builds analyze error default message and retry fallback", () => {
    const res = new Response(null, { status: 429 });
    const result = buildAnalyzeFriendlyError(res, { error: "" });
    expect(result.message).toBe("Aguarde um pouco.");

    const fallback = buildAnalyzeFriendlyError(new Response(null, { status: 418 }), { error: "msg" });
    expect(fallback.message).toBe("msg");

    const invalidRetry = buildAnalyzeFriendlyError(
      new Response(null, { status: 429, headers: { "Retry-After": "abc" } }),
      { error: "" }
    );
    expect(invalidRetry.message).toBe("Aguarde um pouco.");

    const zeroRetry = buildAnalyzeFriendlyError(
      new Response(null, { status: 429, headers: { "Retry-After": "0" } }),
      { error: "" }
    );
    expect(zeroRetry.message).toBe("Aguarde 1s.");

    const noRes = buildAnalyzeFriendlyError(null, { error: "" });
    expect(noRes.message).toBe("Não conseguimos analisar a foto.");

    const nonRecord = buildAnalyzeFriendlyError(new Response(null, { status: 418 }), "bad");
    expect(nonRecord.message).toBe("Não conseguimos analisar a foto.");
  });

  it("maps capture errors by status and api message", () => {
    expect(mapCaptureError(401, "")).toBe("Sessão expirada. Tire outra foto para continuar.");
    expect(mapCaptureError(403, "")).toBe("Não foi possível validar a solicitação. Tente novamente.");
    expect(mapCaptureError(429, "")).toBe("Muitas tentativas. Aguarde um pouco.");
    expect(mapCaptureError(413, "")).toBe("Foto muito grande. Aproxime o documento e tente novamente.");
    expect(mapCaptureError(200, "Imagem inválida.")).toBe("Não foi possível ler a foto. Tente outra foto.");
    expect(mapCaptureError(200, "Requisição inválida.")).toBe("Não conseguimos enviar a foto. Tente novamente.");
    expect(mapCaptureError(200, "Imagem não informada.")).toBe("Nenhuma foto foi enviada. Tente novamente.");
    expect(mapCaptureError(200, "Base64 inválido.")).toBe("Falha ao preparar a foto. Tente outra foto.");
    expect(mapCaptureError(200, "Tipo de imagem não suportado. Use JPG, PNG ou WebP.")).toBe(
      "Formato não suportado. Use JPG, PNG ou WebP."
    );
    expect(mapCaptureError(200, "Tipo de imagem inválido.")).toBe("Formato da foto inválido. Tente outra foto.");
    expect(mapCaptureError(200, "O sistema está temporariamente ocupado. Tente novamente em alguns minutos.")).toBe(
      "Sistema ocupado no momento. Tente em alguns minutos."
    );
    expect(mapCaptureError(200, "O sistema está temporariamente cheio. Tente novamente em instantes.")).toBe(
      "Sistema cheio no momento. Tente novamente em instantes."
    );
    expect(mapCaptureError(500, "")).toBe("Erro interno. Tente novamente.");
    expect(mapCaptureError(200, "")).toBe("Falha ao enviar a imagem.");
  });

  it("maps qa errors by status and api message", () => {
    expect(mapQaError(401, "")).toBe("Sessão expirada. Refaça a análise do documento.");
    expect(mapQaError(403, "")).toBe("Não foi possível validar a solicitação. Tente novamente.");
    expect(mapQaError(429, "")).toBe("Muitas tentativas. Aguarde um pouco.");
    expect(mapQaError(502, "")).toBe("Não conseguimos gerar a resposta. Tente novamente.");
    expect(mapQaError(200, "Requisição inválida.")).toBe("Não conseguimos enviar sua pergunta. Tente novamente.");
    expect(mapQaError(200, "Pergunta muito curta.")).toBe("Sua pergunta é muito curta.");
    expect(mapQaError(200, "Pergunta longa demais.")).toBe("Sua pergunta é muito longa.");
    expect(mapQaError(200, "Contexto do documento não informado.")).toBe(
      "Não conseguimos encontrar o conteúdo do documento."
    );
    expect(mapQaError(200, "Contexto muito longo.")).toBe(
      "O conteúdo do documento é muito longo para responder."
    );
    expect(mapQaError(500, "")).toBe("Erro interno. Tente novamente.");
    expect(mapQaError(200, "")).toBe("Não conseguimos responder agora.");
  });

  it("maps feedback errors by status and api message", () => {
    expect(mapFeedbackError(401, "")).toBe("Sessão expirada. Refaça a análise para enviar feedback.");
    expect(mapFeedbackError(403, "")).toBe("Não foi possível validar a solicitação. Tente novamente.");
    expect(mapFeedbackError(429, "")).toBe("Muitas tentativas. Aguarde um pouco.");
    expect(mapFeedbackError(200, "Feedback inválido.")).toBe("Feedback inválido. Tente novamente.");
    expect(mapFeedbackError(200, "Requisição inválida.")).toBe("Não conseguimos enviar seu feedback. Tente novamente.");
    expect(mapFeedbackError(500, "")).toBe("Erro interno. Tente novamente.");
    expect(mapFeedbackError(200, "")).toBe("Não conseguimos enviar o feedback.");
  });

  it("maps network errors", () => {
    expect(mapNetworkError("")).toBe("Falha de conexão. Verifique sua internet e tente novamente.");
    expect(mapNetworkError("Failed to fetch")).toBe("Falha de conexão. Verifique sua internet e tente novamente.");
    expect(mapNetworkError("Outra mensagem")).toBe("Outra mensagem");
  });
});
