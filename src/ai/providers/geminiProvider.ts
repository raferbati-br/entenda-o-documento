import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalyzeInput, AnswerResponse, AnswerStreamResponse, LlmProvider, ProviderResponse, Prompt } from "../types";
import { parseDataUrl } from "@/lib/dataUrl";
import { parseModelJson } from "./providerUtils";
import { ERROR_MESSAGES } from "@/lib/constants";

export class GeminiProvider implements LlmProvider {
  private readonly client: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error(ERROR_MESSAGES.API_KEY_NOT_SET);
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async analyze(input: AnalyzeInput): Promise<ProviderResponse> {
    if (!input.inputText && !input.imageDataUrl) {
      throw new Error(ERROR_MESSAGES.MISSING_INPUT);
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
      const parsed = parseDataUrl(input.imageDataUrl, { requireImage: true });
      if (!parsed) {
        throw new Error(ERROR_MESSAGES.MISSING_INPUT);
      }
      parts.push({ inlineData: { data: parsed.base64, mimeType: parsed.mimeType } });
    }

    const response = await model.generateContent(parts);
    const text = response.response.text() ?? "";
    const raw = parseModelJson(text);

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
      throw new Error(ERROR_MESSAGES.MODEL_NO_TEXT);
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
