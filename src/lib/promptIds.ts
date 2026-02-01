import {
  DEFAULT_PROMPT_ID,
  DEFAULT_ANALYZE_TEXT_PROMPT_ID,
  DEFAULT_OCR_PROMPT_ID,
  DEFAULT_QA_PROMPT_ID,
} from "@/lib/constants";

export function getAnalyzePromptId(useText: boolean): string {
  return useText
    ? process.env.ANALYZE_TEXT_PROMPT_ID ?? DEFAULT_ANALYZE_TEXT_PROMPT_ID
    : process.env.PROMPT_ID ?? DEFAULT_PROMPT_ID;
}

export function getOcrPromptId(): string {
  return process.env.OCR_PROMPT_ID ?? DEFAULT_OCR_PROMPT_ID;
}

export function getQaPromptId(): string {
  return process.env.QA_PROMPT_ID ?? DEFAULT_QA_PROMPT_ID;
}
