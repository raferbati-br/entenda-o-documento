import { postprocess } from "@/ai/postprocess";
import { entendaDocumento_v1 } from "@/ai/prompts/entendaDocumento.v1";

function bigText(repeat: number) {
  return Array.from({ length: repeat }, () => "texto longo com CPF 123.456.789-00 e email a@b.com").join(" ");
}

describe("postprocess performance", () => {
  it("runs within a reasonable time for large payloads", () => {
    const raw = {
      confidence: 0.5,
      cards: [
        { id: "whatIs", title: "A", text: bigText(200) },
        { id: "whatSays", title: "B", text: bigText(200) },
        { id: "dates", title: "C", text: bigText(200) },
        { id: "terms", title: "D", text: bigText(200) },
        { id: "whatUsuallyHappens", title: "E", text: bigText(200) },
      ],
      notice: bigText(200),
    };

    const start = Date.now();
    const result = postprocess(raw, entendaDocumento_v1);
    const elapsed = Date.now() - start;

    expect(result.cards.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(200); // heuristic for local runs
  });

  it("shortens very long card text", () => {
    const raw = {
      confidence: 0.5,
      cards: [
        {
          id: "whatIs",
          title: "Title",
          text: "a".repeat(600),
        },
      ],
      notice: "",
    };

    const result = postprocess(raw, entendaDocumento_v1);
    const text = result.cards.find((c) => c.id === "whatIs")?.text || "";

    expect(text.startsWith("a".repeat(10))).toBe(true);
    expect(text.length).toBeGreaterThanOrEqual(500);
    expect(text.length).toBeLessThan(600);
  });
});
