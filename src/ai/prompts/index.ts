import type { Prompt } from "../types";
import { entendaDocumento_v1 } from "./entendaDocumento.v1";

export function getPrompt(promptId: string | undefined | null): Prompt {
  const id = (promptId ?? "").trim();

  switch (id) {
    case entendaDocumento_v1.id:
      return entendaDocumento_v1;
    default:
      return entendaDocumento_v1; // fallback seguro
  }
}
