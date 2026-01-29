import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  lang?: string;
  rate?: number;
  unsupportedMessage?: string;
  errorMessage?: string;
  interruptedMessage?: string;
};

export function useSpeechSynthesis(options: Options = {}) {
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopRequestedRef = useRef(false);

  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  const stop = useCallback(
    (opts: { withMessage?: boolean } = {}) => {
      const withMessage = opts.withMessage ?? true;
      stopRequestedRef.current = true;
      if (withMessage && options.interruptedMessage) {
        setError(options.interruptedMessage);
      }
      try {
        window.speechSynthesis.cancel();
      } catch {}
      setIsSpeaking(false);
    },
    [options.interruptedMessage]
  );

  const speak = useCallback(
    (text: string) => {
      if (!text) return;
      if (!supported) {
        setError(options.unsupportedMessage || "Speech synthesis nao suportado.");
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.lang || "pt-BR";
        utterance.rate = options.rate ?? 0.95;
        utterance.onstart = () => {
          setIsSpeaking(true);
          setError(null);
        };
        utterance.onend = () => {
          setIsSpeaking(false);
          stopRequestedRef.current = false;
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          if (stopRequestedRef.current) {
            if (options.interruptedMessage) {
              setError(options.interruptedMessage);
            }
            stopRequestedRef.current = false;
            return;
          }
          setError(options.errorMessage || "Erro na leitura.");
        };
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsSpeaking(false);
        setError(options.errorMessage || "Erro na leitura.");
      }
    },
    [
      options.errorMessage,
      options.interruptedMessage,
      options.lang,
      options.rate,
      options.unsupportedMessage,
      supported,
    ]
  );

  return {
    supported,
    isSpeaking,
    error,
    setError,
    speak,
    stop,
  };
}
