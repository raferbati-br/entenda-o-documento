export function getAnalyzePromptId(useText: boolean): string {
  return useText
    ? process.env.ANALYZE_TEXT_PROMPT_ID ?? "entendaDocumento.text.v1"
    : process.env.PROMPT_ID ?? "entendaDocumento.v1";
}

export function getOcrPromptId(): string {
  return process.env.OCR_PROMPT_ID ?? "entendaDocumento.ocr.v1";
}

export function getQaPromptId(): string {
  return process.env.QA_PROMPT_ID ?? "entendaDocumento.qa.v1";
}
