import type { QaStreamEvent } from "@/lib/qaStream";
import { readQaStream, serializeQaStreamEvent } from "@/lib/qaStream";

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

describe("qaStream", () => {
  it("parses ndjson events across chunks", async () => {
    const events = [
      { type: "delta", text: "Ola " },
      { type: "delta", text: "mundo" },
      { type: "done" },
    ] as const;

    const payload = events.map((event) => serializeQaStreamEvent(event)).join("");
    const midpoint = Math.floor(payload.length / 2);
    const stream = makeStream([payload.slice(0, midpoint), payload.slice(midpoint)]);

    const received: QaStreamEvent[] = [];
    for await (const event of readQaStream(stream)) {
      received.push(event);
    }

    expect(received).toEqual(events);
  });

  it("parses final line without newline", async () => {
    const event = { type: "delta", text: "teste" } as const;
    const payload = serializeQaStreamEvent(event).trimEnd();
    const stream = makeStream([payload]);

    const received: QaStreamEvent[] = [];
    for await (const item of readQaStream(stream)) {
      received.push(item);
    }

    expect(received).toEqual([event]);
  });

  it("skips empty lines between events", async () => {
    const events = [{ type: "delta", text: "a" }, { type: "done" }] as const;
    const payload = `${serializeQaStreamEvent(events[0])}\n${serializeQaStreamEvent(events[1])}`;
    const stream = makeStream([payload]);

    const received: QaStreamEvent[] = [];
    for await (const item of readQaStream(stream)) {
      received.push(item);
    }

    expect(received).toEqual(events);
  });
});
