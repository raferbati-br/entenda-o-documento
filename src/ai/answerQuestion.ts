import { getQaPrompt } from "./prompts";
import { getProvider } from "./providers";

function safeShorten(s: string, max = 420) {
  const t = (s || "").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max - 3).trimEnd() + "...";
}

function renderTemplate(template: string, vars: Record<string, string>) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

export async function answerQuestion(input: {
  question: string;
  context: string;
}): Promise<{ answer: string; meta: { provider: string; model: string }; promptId: string }> {
  const promptId = process.env.QA_PROMPT_ID ?? "entendaDocumento.qa.v1";
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";

  const prompt = getQaPrompt(promptId);
  const provider = getProvider();

  const user = renderTemplate(prompt.user, {
    context: input.context,
    question: input.question,
  });

  const { text, meta } = await provider.answer({
    model,
    prompt: { ...prompt, user },
  });

  return {
    answer: safeShorten(text, 420),
    meta,
    promptId: prompt.id,
  };
}

export async function answerQuestionStream(input: {
  question: string;
  context: string;
}): Promise<{ stream: AsyncIterable<string>; meta: { provider: string; model: string }; promptId: string }> {
  const promptId = process.env.QA_PROMPT_ID ?? "entendaDocumento.qa.v1";
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";

  const prompt = getQaPrompt(promptId);
  const provider = getProvider();

  const user = renderTemplate(prompt.user, {
    context: input.context,
    question: input.question,
  });

  if (provider.answerStream) {
    const { stream, meta } = await provider.answerStream({
      model,
      prompt: { ...prompt, user },
    });
    return { stream, meta, promptId: prompt.id };
  }

  const { text, meta } = await provider.answer({
    model,
    prompt: { ...prompt, user },
  });

  async function* iterator() {
    yield text;
  }

  return { stream: iterator(), meta, promptId: prompt.id };
}
