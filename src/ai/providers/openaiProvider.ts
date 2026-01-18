import OpenAI from "openai";
import type { LlmProvider, ProviderResponse, Prompt, AnswerResponse } from "../types";

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

export class OpenAIProvider implements LlmProvider {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY_NOT_SET");
    this.client = new OpenAI({ apiKey });
  }

  async analyze(input: { model: string; prompt: Prompt; imageDataUrl: string }): Promise<ProviderResponse> {
    const resp = await this.client.responses.create({
      model: input.model,
      input: [
        {
          type: "message",
          role: "system",
          content: [{ type: "input_text", text: input.prompt.system }],
        },
        {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: input.prompt.user },
            { type: "input_image", image_url: input.imageDataUrl, detail: "auto" },
          ],
        },
      ],
    });

    const text = resp.output_text ?? "";

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const extracted = extractFirstJsonObject(text);
      if (!extracted) {
        const err = new Error("MODEL_NO_JSON");
        (err as any).raw = text;
        throw err;
      }
      try {
        parsed = JSON.parse(extracted);
      } catch {
        const err = new Error("MODEL_INVALID_JSON");
        (err as any).raw = text;
        throw err;
      }
    }

    return {
      raw: parsed,
      meta: { provider: "openai", model: input.model },
    };
  }

  async answer(input: { model: string; prompt: Prompt }): Promise<AnswerResponse> {
    const resp = await this.client.responses.create({
      model: input.model,
      input: [
        {
          type: "message",
          role: "system",
          content: [{ type: "input_text", text: input.prompt.system }],
        },
        {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: input.prompt.user }],
        },
      ],
    });

    const text = (resp.output_text ?? "").trim();
    if (!text) {
      throw new Error("MODEL_NO_TEXT");
    }

    return {
      text,
      meta: { provider: "openai", model: input.model },
    };
  }
}
