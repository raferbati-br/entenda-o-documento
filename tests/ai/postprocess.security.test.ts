import { describe, it, expect } from "vitest";
import { postprocess, postprocessWithStats } from "@/ai/postprocess";
import { entendaDocumento_v1 } from "@/ai/prompts/entendaDocumento.v1";

describe("postprocess security", () => {
  it("redacts CPF/CNPJ/email/phone/linha digitavel", () => {
    const raw = {
      confidence: 0.8,
      cards: [
        { id: "whatIs", title: "Teste", text: "CPF 123.456.789-00 e CNPJ 12.345.678/0001-99." },
        { id: "whatSays", title: "Email", text: "Contato: teste@email.com e +55 (11) 99999-0000" },
        { id: "dates", title: "Linha", text: "Linha: 00190.00009 01234.567890 12345.678901 2 12345678901234" },
      ],
      notice: "Contato: teste@email.com",
    };

    const result = postprocess(raw, entendaDocumento_v1);
    const joined = result.cards.map((c) => c.text).join(" ") + " " + result.notice;
    expect(joined).not.toMatch(/123\.456\.789-00/);
    expect(joined).not.toMatch(/12\.345\.678\/0001-99/);
    expect(joined).not.toMatch(/teste@email\.com/);
    expect(joined).not.toMatch(/\(11\)\s?99999-0000/);
    expect(joined).not.toMatch(/00190\.00009/);
    expect(joined).toContain("***");
  });

  it("softens prescriptive language", () => {
    const raw = {
      confidence: 0.9,
      cards: [{ id: "whatSays", title: "Teste", text: "Você deve pagar e tem que agir." }],
      notice: "",
    };
    const result = postprocess(raw, entendaDocumento_v1);
    const text = result.cards.find((c) => c.id === "whatSays")?.text || "";
    expect(text).toMatch(/documento indica|documento menciona/);
    expect(text).not.toMatch(/você deve|tem que/i);
  });
  it("uses defaults and clamps confidence for invalid input", () => {
    const raw = {
      confidence: 2,
      cards: [{ id: 123, title: "bad", text: "bad" }],
      notice: 123,
    };

    const { result, stats } = postprocessWithStats(raw, entendaDocumento_v1);

    expect(result.confidence).toBe(1);
    expect(result.cards.map((c) => c.id)).toEqual([
      "whatIs",
      "whatSays",
      "dates",
      "terms",
      "whatUsuallyHappens",
    ]);
    for (const card of result.cards) {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.text.length).toBeGreaterThan(0);
    }
    expect(result.notice.startsWith("Esta explica")).toBe(true);
    expect(stats.sanitizerApplied).toBe(false);
    expect(stats.confidenceLow).toBe(false);
  });

  it("handles non-finite confidence and non-array cards", () => {
    const raw = {
      confidence: "nope",
      cards: "invalid",
      notice: "notice",
    };

    const { result, stats } = postprocessWithStats(raw, entendaDocumento_v1);

    expect(result.confidence).toBe(0);
    expect(stats.confidenceLow).toBe(true);
    expect(result.notice.startsWith("A imagem parece estar pouco")).toBe(true);
    expect(result.cards.length).toBe(5);
  });

  it("flags low confidence and prefixes the notice", () => {
    const raw = {
      confidence: 0.2,
      cards: [],
      notice: "plain notice",
    };

    const { result, stats } = postprocessWithStats(raw, entendaDocumento_v1);

    expect(stats.confidenceLow).toBe(true);
    expect(stats.sanitizerApplied).toBe(false);
    expect(result.notice.startsWith("A imagem parece estar pouco")).toBe(true);
    expect(result.notice).toContain("plain notice");
  });

  it("exposes a wrapper that returns the analyze result", () => {
    const raw = { confidence: 0.7, cards: [], notice: "" };
    const result = postprocess(raw, entendaDocumento_v1);

    expect(result.cards.length).toBe(5);
    expect(result.confidence).toBe(0.7);
  });
});
