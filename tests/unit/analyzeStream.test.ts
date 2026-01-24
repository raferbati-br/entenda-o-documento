import { describe, expect, it } from "vitest";
import { extractCardsFromJsonStream, readAnalyzeStream, serializeAnalyzeStreamEvent } from "@/lib/analyzeStream";

function makeStream(chunks: string[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

describe("analyzeStream", () => {
  it("extracts completed card objects from partial JSON", () => {
    const seen = new Set<string>();
    const buffer =
      '{"cards":[{"id":"whatIs","title":"A","text":"B"},{"id":"whatSays","title":"C","text":"';
    const cards = extractCardsFromJsonStream(buffer, seen);
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe("whatIs");
  });

  it("handles braces inside string values", () => {
    const seen = new Set<string>();
    const buffer = '{"cards":[{"id":"whatIs","title":"A","text":"Tem {chaves} aqui"}]}';
    const cards = extractCardsFromJsonStream(buffer, seen);
    expect(cards).toHaveLength(1);
    expect(cards[0].text).toBe("Tem {chaves} aqui");
  });

  it("parses ndjson events across chunks", async () => {
    const events = [
      { type: "card", card: { id: "whatIs", title: "A", text: "B" } },
      { type: "result", result: { confidence: 0.7, notice: "", cards: [] } },
    ] as const;

    const payload = events.map((event) => serializeAnalyzeStreamEvent(event)).join("");
    const midpoint = Math.floor(payload.length / 2);
    const stream = makeStream([payload.slice(0, midpoint), payload.slice(midpoint)]);

    const received: typeof events[number][] = [];
    for await (const event of readAnalyzeStream(stream)) {
      received.push(event);
    }

    expect(received).toEqual(events);
  });
});
