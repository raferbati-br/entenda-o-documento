import { getAnalyzeTextPromptId, getAnalyzeImagePromptId, getOcrPromptId, getQaPromptId } from "@/lib/promptIds";


describe("promptIds", () => {
  const realEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...realEnv };
    delete process.env.ANALYZE_TEXT_PROMPT_ID;
    delete process.env.PROMPT_ID;
    delete process.env.OCR_PROMPT_ID;
    delete process.env.QA_PROMPT_ID;
  });

  afterEach(() => {
    process.env = { ...realEnv };
  });

  it("returns defaults when env is not set", () => {
    expect(getAnalyzeTextPromptId()).toBe("entendaDocumento.text.v1");
    expect(getAnalyzeImagePromptId()).toBe("entendaDocumento.v1");
    expect(getOcrPromptId()).toBe("entendaDocumento.ocr.v1");
    expect(getQaPromptId()).toBe("entendaDocumento.qa.v1");
  });

  it("uses env overrides", () => {
    process.env.ANALYZE_TEXT_PROMPT_ID = "text-1";
    process.env.PROMPT_ID = "img-1";
    process.env.OCR_PROMPT_ID = "ocr-1";
    process.env.QA_PROMPT_ID = "qa-1";

    expect(getAnalyzeTextPromptId()).toBe("text-1");
    expect(getAnalyzeImagePromptId()).toBe("img-1");
    expect(getOcrPromptId()).toBe("ocr-1");
    expect(getQaPromptId()).toBe("qa-1");
  });
});
