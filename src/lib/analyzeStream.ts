import type { AnalysisResult, Card } from "@/lib/resultStore";

export type AnalyzeStreamEvent =
  | { type: "card"; card: Partial<Card> & { id: string } }
  | { type: "result"; result: AnalysisResult }
  | { type: "error"; message: string };

const CARD_IDS = new Set(["whatIs", "whatSays", "dates", "terms", "whatUsuallyHappens"]);

type ObjectSlice = { start: number; end: number };

function findCompletedObjectSlices(text: string): ObjectSlice[] {
  const slices: ObjectSlice[] = [];
  const stack: number[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") {
      stack.push(i);
      continue;
    }
    if (ch === "}") {
      const start = stack.pop();
      if (start !== undefined) {
        slices.push({ start, end: i + 1 });
      }
    }
  }

  return slices;
}

export function extractCardsFromJsonStream(text: string, seen: Set<string>): Array<Partial<Card> & { id: string }> {
  const found: Array<Partial<Card> & { id: string }> = [];
  const slices = findCompletedObjectSlices(text);

  for (const slice of slices) {
    const chunk = text.slice(slice.start, slice.end);
    let parsed: any;
    try {
      parsed = JSON.parse(chunk);
    } catch {
      continue;
    }

    const id = typeof parsed?.id === "string" ? parsed.id : "";
    if (!id || !CARD_IDS.has(id) || seen.has(id)) continue;

    found.push({
      id,
      title: typeof parsed?.title === "string" ? parsed.title : "",
      text: typeof parsed?.text === "string" ? parsed.text : "",
    });
    seen.add(id);
  }

  return found;
}

export function serializeAnalyzeStreamEvent(event: AnalyzeStreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}

export async function* readAnalyzeStream(stream: ReadableStream<Uint8Array>): AsyncIterable<AnalyzeStreamEvent> {
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
        yield JSON.parse(line) as AnalyzeStreamEvent;
      }
      newlineIndex = buffer.indexOf("\n");
    }
  }

  const tail = buffer.trim();
  if (tail) {
    yield JSON.parse(tail) as AnalyzeStreamEvent;
  }
}
