/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { useSpeechSynthesis } from "@/lib/hooks/useSpeechSynthesis";

class MockUtterance {
  text: string;
  lang = "";
  rate = 1;
  onstart?: () => void;
  onend?: () => void;
  onerror?: () => void;
  constructor(text: string) {
    this.text = text;
  }
}

type HookState = ReturnType<typeof useSpeechSynthesis> | null;

function renderHook(options?: Parameters<typeof useSpeechSynthesis>[0]) {
  const stateRef: { current: HookState } = { current: null };
  function Test() {
    // eslint-disable-next-line react-hooks/immutability
    stateRef.current = useSpeechSynthesis(options);
    return null;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Test />);
  });
  return { root, getState: () => stateRef.current! };
}

describe("useSpeechSynthesis", () => {
  let lastUtterance: MockUtterance | null = null;

  beforeEach(() => {
    lastUtterance = null;
    vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
    const speak = vi.fn((utterance: MockUtterance) => {
      lastUtterance = utterance;
    });
    const cancel = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("speaks text and updates state", () => {
    const { getState } = renderHook({ errorMessage: "erro" });

    act(() => {
      getState().speak("ola");
    });

    expect(lastUtterance?.text).toBe("ola");
    act(() => {
      lastUtterance?.onstart?.();
    });
    expect(getState().isSpeaking).toBe(true);

    act(() => {
      lastUtterance?.onend?.();
    });
    expect(getState().isSpeaking).toBe(false);
  });

  it("sets error when unsupported", () => {
    vi.unstubAllGlobals();
    const { getState } = renderHook({ unsupportedMessage: "nao" });

    act(() => {
      getState().speak("ola");
    });

    expect(getState().error).toBe("nao");
  });

  it("speaks sequence and advances", () => {
    vi.useFakeTimers();
    const { getState } = renderHook();

    act(() => {
      getState().speakSequence(["a", " ", "b"], 10);
    });

    const first = lastUtterance;
    act(() => {
      first?.onstart?.();
      first?.onend?.();
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(lastUtterance?.text).toBe("b");
    vi.useRealTimers();
  });
});
