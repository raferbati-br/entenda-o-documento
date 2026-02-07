/** @jest-environment jsdom */
import { stubGlobal, unstubAllGlobals } from "./jestGlobals";
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
    stubGlobal("SpeechSynthesisUtterance", MockUtterance);
    const speak = jest.fn((utterance: MockUtterance) => {
      lastUtterance = utterance;
    });
    const cancel = jest.fn();
    stubGlobal("speechSynthesis", { speak, cancel });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    unstubAllGlobals();
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
    unstubAllGlobals();
    const { getState } = renderHook({ unsupportedMessage: "nao" });

    act(() => {
      getState().speak("ola");
    });

    expect(getState().error).toBe("nao");
  });

  it("stops speech and sets interrupted message", () => {
    const { getState } = renderHook({ interruptedMessage: "interrompido" });

    act(() => {
      getState().speak("ola");
    });
    act(() => {
      getState().stop();
    });

    expect(getState().isSpeaking).toBe(false);
    expect(getState().error).toBe("interrompido");
  });

  it("sets interrupted message when onerror happens after stop request", () => {
    const { getState } = renderHook({ interruptedMessage: "parou" });

    act(() => {
      getState().speak("ola");
    });

    act(() => {
      getState().stop({ withMessage: false });
      lastUtterance?.onerror?.();
    });

    expect(getState().error).toBe("parou");
  });

  it("ignores stop error message when no interruptedMessage is set", () => {
    const { getState } = renderHook();

    act(() => {
      getState().speak("ola");
    });

    act(() => {
      getState().stop({ withMessage: true });
      lastUtterance?.onerror?.();
    });

    expect(getState().error).toBeNull();
  });

  it("sets error when speak throws", () => {
    unstubAllGlobals();
    stubGlobal("SpeechSynthesisUtterance", MockUtterance);
    stubGlobal("speechSynthesis", {
      speak: () => {
        throw new Error("boom");
      },
      cancel: jest.fn(),
    });

    const { getState } = renderHook({ errorMessage: "erro" });
    act(() => {
      getState().speak("ola");
    });

    expect(getState().error).toBe("erro");
    expect(getState().isSpeaking).toBe(false);
  });

  it("swallows errors when cancel throws during stop", () => {
    stubGlobal("speechSynthesis", {
      speak: jest.fn(),
      cancel: () => {
        throw new Error("cancel-fail");
      },
    });
    const { getState } = renderHook();

    act(() => {
      getState().stop();
    });

    expect(getState().isSpeaking).toBe(false);
  });

  it("sets error on utterance error when not interrupted", () => {
    const { getState } = renderHook({ errorMessage: "erro" });

    act(() => {
      getState().speak("ola");
    });

    act(() => {
      lastUtterance?.onerror?.();
    });

    expect(getState().error).toBe("erro");
    expect(getState().isSpeaking).toBe(false);
  });

  it("ignores empty text", () => {
    const { getState } = renderHook();
    act(() => {
      getState().speak("");
    });
    expect(lastUtterance).toBeNull();
  });

  it("ignores empty sequences", () => {
    const { getState } = renderHook();
    act(() => {
      getState().speakSequence([]);
    });
    expect(lastUtterance).toBeNull();
    expect(getState().isSpeaking).toBe(false);
  });

  it("speaks sequence and advances", () => {
    jest.useFakeTimers();
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
      jest.runAllTimers();
    });

    expect(lastUtterance?.text).toBe("b");
    jest.useRealTimers();
  });

  it("stops sequence when only blank parts are provided", () => {
    const { getState } = renderHook();
    act(() => {
      getState().speakSequence([" ", "\n"]);
    });
    expect(lastUtterance).toBeNull();
    expect(getState().isSpeaking).toBe(false);
  });

  it("sets interrupted message on sequence error after stop", () => {
    const { getState } = renderHook({ interruptedMessage: "parou" });

    act(() => {
      getState().speakSequence(["a"]);
    });

    act(() => {
      getState().stop({ withMessage: false });
      lastUtterance?.onerror?.();
    });

    expect(getState().error).toBe("parou");
    expect(getState().isSpeaking).toBe(false);
  });

  it("stops sequence on end after stop request", () => {
    const { getState } = renderHook();

    act(() => {
      getState().speakSequence(["a", "b"]);
    });

    act(() => {
      getState().stop({ withMessage: false });
      lastUtterance?.onend?.();
    });

    expect(getState().isSpeaking).toBe(false);
  });

  it("finishes sequence when last part ends", () => {
    const { getState } = renderHook();

    act(() => {
      getState().speakSequence(["a"]);
    });

    act(() => {
      lastUtterance?.onend?.();
    });

    expect(getState().isSpeaking).toBe(false);
  });

  it("clears pending sequence timer on stop", () => {
    jest.useFakeTimers();
    const clearSpy = jest.fn();
    stubGlobal("clearTimeout", clearSpy);
    const { getState } = renderHook();

    act(() => {
      getState().speakSequence(["a", "b"], 50);
    });

    act(() => {
      lastUtterance?.onend?.();
    });

    act(() => {
      getState().stop({ withMessage: false });
    });

    expect(clearSpy).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("bails out when a queued sequence callback runs after stop", () => {
    let scheduled: (() => void) | null = null;
    const setSpy = jest.spyOn(globalThis, "setTimeout").mockImplementation((cb) => {
      scheduled = cb as () => void;
      return 123 as unknown as ReturnType<typeof setTimeout>;
    });
    stubGlobal("clearTimeout", jest.fn(() => undefined));
    const { getState } = renderHook();

    act(() => {
      getState().speakSequence(["a", "b"], 10);
    });

    act(() => {
      lastUtterance?.onend?.();
    });

    act(() => {
      getState().stop({ withMessage: false });
      scheduled?.();
    });

    expect(getState().isSpeaking).toBe(false);
    setSpy.mockRestore();
  });

  it("ignores stale sequence events after a new sequence starts", () => {
    const { getState } = renderHook();

    act(() => {
      getState().speakSequence(["a", "b"]);
    });

    const first = lastUtterance;

    act(() => {
      getState().speakSequence(["c"]);
    });

    act(() => {
      first?.onend?.();
    });

    expect(getState().isSpeaking).toBe(false);
  });

  it("sets error when sequence is unsupported", () => {
    unstubAllGlobals();
    const { getState } = renderHook({ unsupportedMessage: "nao" });

    act(() => {
      getState().speakSequence(["a"]);
    });

    expect(getState().error).toBe("nao");
  });

  it("cleans up on unmount even if cancel throws", () => {
    stubGlobal("speechSynthesis", {
      speak: jest.fn(),
      cancel: () => {
        throw new Error("cancel-fail");
      },
    });

    const { root } = renderHook();
    expect(() => {
      act(() => root.unmount());
    }).not.toThrow();
  });

  it("sets error when sequence onerror occurs", () => {
    const { getState } = renderHook({ errorMessage: "erro" });

    act(() => {
      getState().speakSequence(["a"]);
    });

    act(() => {
      lastUtterance?.onerror?.();
    });

    expect(getState().error).toBe("erro");
    expect(getState().isSpeaking).toBe(false);
  });
});
