import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalyzeInput, AnswerResponse, AnswerStreamResponse, LlmProvider, ProviderResponse, Prompt } from "../types";

type ParsedDataUrl = {
  mimeType: string;
  base64: string;
};

type ModelParseError = Error & { raw?: string };

function parseDataUrl(value: string): ParsedDataUrl | null {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const extracted = extractFirstJsonObject(text);
    if (!extracted) {
      const err: ModelParseError = new Error("MODEL_NO_JSON");
      err.raw = text;
      throw err;
    }
    try {
      return JSON.parse(extracted);
    } catch {
      const err: ModelParseError = new Error("MODEL_INVALID_JSON");
      err.raw = text;
      throw err;
    }
  }
}

export class GeminiProvider implements LlmProvider {
  private client: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("API_KEY_NOT_SET");
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async analyze(input: AnalyzeInput): Promise<ProviderResponse> {
    if (!input.inputText && !input.imageDataUrl) {
      throw new Error("ANALYZE_INPUT_MISSING");
    }

    const model = this.client.getGenerativeModel({
      model: input.model,
      systemInstruction: input.prompt.system,
    });

    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      { text: input.prompt.user },
    ];

    if (input.inputText) {
      parts.push({ text: input.inputText });
    }

    if (input.imageDataUrl) {
      const parsed = parseDataUrl(input.imageDataUrl);
      if (!parsed) {
        throw new Error("ANALYZE_INPUT_MISSING");
      }
      parts.push({ inlineData: { data: parsed.base64, mimeType: parsed.mimeType } });
    }

    const response = await model.generateContent(parts);
    const text = response.response.text() ?? "";
    const raw = parseJson(text);

    return {
      raw,
      meta: { provider: "gemini", model: input.model },
    };
  }

  async answer(input: { model: string; prompt: Prompt }): Promise<AnswerResponse> {
    const model = this.client.getGenerativeModel({
      model: input.model,
      systemInstruction: input.prompt.system,
    });
    const response = await model.generateContent([{ text: input.prompt.user }]);
    const text = (response.response.text() ?? "").trim();
    if (!text) {
      throw new Error("MODEL_NO_TEXT");
    }
    return {
      text,
      meta: { provider: "gemini", model: input.model },
    };
  }

  async answerStream(input: { model: string; prompt: Prompt }): Promise<AnswerStreamResponse> {
    const model = this.client.getGenerativeModel({
      model: input.model,
      systemInstruction: input.prompt.system,
    });

    const result = await model.generateContentStream([{ text: input.prompt.user }]);

    async function* iterator() {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    }

    return {
      stream: iterator(),
      meta: { provider: "gemini", model: input.model },
    };
  }
}
