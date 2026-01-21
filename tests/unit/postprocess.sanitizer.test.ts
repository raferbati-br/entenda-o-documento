import { describe, it, expect } from "vitest";
import { postprocess, postprocessWithStats } from "@/ai/postprocess";
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

  it("applies sanitizer penalty and redacts sensitive data", () => {
    const raw = {
      confidence: 0.9,
      cards: [
        {
          id: "whatSays",
          title: "Summary",
          text: "tem que pagar usando user@example.com",
        },
      ],
      notice: "procure imediatamente o suporte",
    };

    const { result, stats } = postprocessWithStats(raw, entendaDocumento_v1);
    const cardText = result.cards.find((c) => c.id === "whatSays")?.text || "";

    expect(stats.sanitizerApplied).toBe(true);
    expect(stats.confidenceLow).toBe(false);
    expect(result.confidence).toBe(0.8);
    expect(cardText).not.toMatch(/tem que/i);
    expect(cardText).not.toContain("user@example.com");
    expect(cardText).toContain("***");
    expect(result.notice).not.toMatch(/procure imediatamente/i);
  });
});
