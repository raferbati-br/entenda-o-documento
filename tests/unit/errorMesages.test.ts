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
  });

  it("maps capture errors by status and api message", () => {
    expect(mapCaptureError(413, "")).toBe("Foto muito grande. Aproxime o documento e tente novamente.");
    expect(mapCaptureError(200, "Imagem inválida.")).toBe("Não foi possível ler a foto. Tente outra foto.");
    expect(mapCaptureError(500, "")).toBe("Erro interno. Tente novamente.");
    expect(mapCaptureError(200, "")).toBe("Falha ao enviar a imagem.");
  });

  it("maps qa errors by status and api message", () => {
    expect(mapQaError(502, "")).toBe("Não conseguimos gerar a resposta. Tente novamente.");
    expect(mapQaError(200, "Pergunta muito curta.")).toBe("Sua pergunta é muito curta.");
    expect(mapQaError(500, "")).toBe("Erro interno. Tente novamente.");
    expect(mapQaError(200, "")).toBe("Não conseguimos responder agora.");
  });

  it("maps feedback errors by status and api message", () => {
    expect(mapFeedbackError(403, "")).toBe("Não foi possível validar a solicitação. Tente novamente.");
    expect(mapFeedbackError(200, "Feedback inválido.")).toBe("Feedback inválido. Tente novamente.");
    expect(mapFeedbackError(500, "")).toBe("Erro interno. Tente novamente.");
    expect(mapFeedbackError(200, "")).toBe("Não conseguimos enviar o feedback.");
  });

  it("maps network errors", () => {
    expect(mapNetworkError("")).toBe("Falha de conexão. Verifique sua internet e tente novamente.");
    expect(mapNetworkError("Failed to fetch")).toBe("Falha de conexão. Verifique sua internet e tente novamente.");
    expect(mapNetworkError("Outra mensagem")).toBe("Outra mensagem");
  });
});
