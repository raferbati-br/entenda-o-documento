import OpenAI from "openai";
import type { AnalyzeInput, LlmProvider, ProviderResponse, Prompt, AnswerResponse, AnswerStreamResponse } from "../types";
import { parseModelJson } from "./providerUtils";
import { ERROR_MESSAGES } from "@/lib/constants";

export class OpenAIProvider implements LlmProvider {
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error(ERROR_MESSAGES.API_KEY_NOT_SET);
    this.client = new OpenAI({ apiKey });
  }

  async analyze(input: AnalyzeInput): Promise<ProviderResponse> {
    if (!input.inputText && !input.imageDataUrl) {
      throw new Error(ERROR_MESSAGES.MISSING_INPUT);
    }

    const userContent: Array<
      { type: "input_text"; text: string } | { type: "input_image"; image_url: string; detail: "auto" }
    > = [{ type: "input_text", text: input.prompt.user }];

    if (input.inputText) {
      userContent.push({ type: "input_text", text: input.inputText });
    }
    if (input.imageDataUrl) {
      userContent.push({ type: "input_image", image_url: input.imageDataUrl, detail: "auto" });
    }

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
          content: userContent,
        },
      ],
    });

    const text = resp.output_text ?? "";

    const parsed = parseModelJson(text);

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
      throw new Error(ERROR_MESSAGES.MODEL_NO_TEXT);
    }

    return {
      text,
      meta: { provider: "openai", model: input.model },
    };
  }

  async answerStream(input: { model: string; prompt: Prompt }): Promise<AnswerStreamResponse> {
    const stream = await this.client.responses.create({
      model: input.model,
      stream: true,
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

    async function* iterator() {
      for await (const event of stream) {
        if (event.type === "response.output_text.delta" && event.delta) {
          yield event.delta;
        }
      }
    }

    return {
      stream: iterator(),
      meta: { provider: "openai", model: input.model },
    };
  }
}
