export type QaStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export function serializeQaStreamEvent(event: QaStreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}

export async function* readQaStream(stream: ReadableStream<Uint8Array>): AsyncIterable<QaStreamEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line) {
        yield JSON.parse(line) as QaStreamEvent;
      }
      newlineIndex = buffer.indexOf("\n");
    }
  }

  const tail = buffer.trim();
  if (tail) {
    yield JSON.parse(tail) as QaStreamEvent;
  }
}
