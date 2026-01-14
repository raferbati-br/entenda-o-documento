import { describe, it, expect } from "vitest";
import { postprocess } from "@/ai/postprocess";
import { entendaDocumento_v1 } from "@/ai/prompts/entendaDocumento.v1";

describe("postprocess sanitizer behavior", () => {
  it("softens prescriptive language in notice", () => {
    const raw = {
      confidence: 0.8,
      cards: [{ id: "whatSays", title: "Resumo", text: "Tem que pagar hoje." }],
      notice: "A pessoa tem que pagar agora. Procure imediatamente o setor responsavel.",
    };

    const result = postprocess(raw, entendaDocumento_v1);

    expect(result.notice).not.toMatch(/tem que/i);
    expect(result.notice).not.toMatch(/procure imediatamente/i);
  });

  it("reduces confidence when prescriptive language was softened", () => {
    const raw = {
      confidence: 0.9,
      cards: [{ id: "whatSays", title: "Resumo", text: "Tem que pagar hoje." }],
      notice: "",
    };

    const result = postprocess(raw, entendaDocumento_v1);
    const text = result.cards.find((c) => c.id === "whatSays")?.text || "";

    expect(text).not.toMatch(/tem que/i);
    expect(result.confidence).toBeLessThan(raw.confidence);
  });

  it("keeps confidence when no prescriptive language is present", () => {
    const raw = {
      confidence: 0.6,
      cards: [{ id: "whatSays", title: "Resumo", text: "Documento indica pagamento." }],
      notice: "Explicacao informativa apenas.",
    };

    const result = postprocess(raw, entendaDocumento_v1);

    expect(result.confidence).toBeCloseTo(raw.confidence, 5);
  });
});
