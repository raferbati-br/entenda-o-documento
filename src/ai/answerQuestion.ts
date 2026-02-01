/**
 * Módulo para responder perguntas sobre documentos usando IA.
 * Recebe uma pergunta e contexto, e retorna uma resposta curta ou um stream.
 */

import { getQaPrompt } from "./prompts";
import { getQaPromptId } from "../lib/promptIds";
import { buildLlmContext } from "./llmContext";
import { safeShorten } from "../lib/text";

// Função auxiliar para substituir variáveis em templates de prompt
function renderTemplate(template: string, vars: Record<string, string>) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

// Responde a uma pergunta de forma síncrona, retornando a resposta completa
export async function answerQuestion(input: {
  question: string;
  context: string;
}): Promise<{ answer: string; meta: { provider: string; model: string }; promptId: string }> {
  const promptId = getQaPromptId();
  const { model, provider } = buildLlmContext();

  const prompt = getQaPrompt(promptId);

  // Substitui variáveis no template do prompt do usuário
  const user = renderTemplate(prompt.user, {
    context: input.context,
    question: input.question,
  });

  const { text, meta } = await provider.answer({
    model,
    prompt: { ...prompt, user },
  });

  return {
    answer: safeShorten(text, 420), // Limita o tamanho da resposta
    meta,
    promptId: prompt.id,
  };
}

// Responde a uma pergunta de forma assíncrona, retornando um stream de texto
export async function answerQuestionStream(input: {
  question: string;
  context: string;
}): Promise<{ stream: AsyncIterable<string>; meta: { provider: string; model: string }; promptId: string }> {
  const promptId = getQaPromptId();
  const { model, provider } = buildLlmContext();

  const prompt = getQaPrompt(promptId);

  // Substitui variáveis no template do prompt do usuário
  const user = renderTemplate(prompt.user, {
    context: input.context,
    question: input.question,
  });

  // Usa stream se suportado pelo provedor, senão simula com iterator
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

  // Cria um iterator simples para simular stream
  async function* iterator() {
    yield text;
  }

  return { stream: iterator(), meta, promptId: prompt.id };
}
