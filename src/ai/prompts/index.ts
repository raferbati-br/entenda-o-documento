import type { Prompt } from "../types";
import { entendaDocumento_v1 } from "./entendaDocumento.v1";
import { entendaDocumento_qa_v1 } from "./entendaDocumento.qa.v1";
import { entendaDocumento_ocr_v1 } from "./entendaDocumento.ocr.v1";
import { entendaDocumento_text_v1 } from "./entendaDocumento.text.v1";

export function getPrompt(promptId: string | undefined | null): Prompt {
  const id = (promptId ?? "").trim();

  if (id === entendaDocumento_text_v1.id) {
    return entendaDocumento_text_v1;
  }
  return entendaDocumento_v1; // fallback seguro
}

export function getQaPrompt(promptId: string | undefined | null): Prompt {
  const id = (promptId ?? "").trim();
  if (id) {
    return entendaDocumento_qa_v1;
  }
  return entendaDocumento_qa_v1;
}

export function getOcrPrompt(promptId: string | undefined | null): Prompt {
  const id = (promptId ?? "").trim();
  if (id) {
    return entendaDocumento_ocr_v1;
  }
  return entendaDocumento_ocr_v1;
}
