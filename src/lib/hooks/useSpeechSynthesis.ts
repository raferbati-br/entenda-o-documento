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
  const sequenceTimerRef = useRef<number | null>(null);
  const sequenceIdRef = useRef(0);

  const clearSequenceTimer = () => {
    if (sequenceTimerRef.current !== null) {
      window.clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
  };

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
      clearSequenceTimer();
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
        stopRequestedRef.current = false;
        clearSequenceTimer();
        sequenceIdRef.current += 1;
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

  const speakSequence = useCallback(
    (parts: string[], pauseMs = 350) => {
      if (!parts.length) return;
      if (!supported) {
        setError(options.unsupportedMessage || "Speech synthesis nao suportado.");
        return;
      }

      stopRequestedRef.current = false;
      clearSequenceTimer();
      sequenceIdRef.current += 1;
      const sequenceId = sequenceIdRef.current;

      try {
        window.speechSynthesis.cancel();
      } catch {}

      setError(null);
      setIsSpeaking(true);

      let index = 0;
      const speakNext = () => {
        if (stopRequestedRef.current || sequenceId !== sequenceIdRef.current) {
          setIsSpeaking(false);
          stopRequestedRef.current = false;
          return;
        }

        while (index < parts.length && !parts[index]?.trim()) {
          index += 1;
        }
        if (index >= parts.length) {
          setIsSpeaking(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(parts[index].trim());
        utterance.lang = options.lang || "pt-BR";
        utterance.rate = options.rate ?? 0.95;
        utterance.onstart = () => {
          setIsSpeaking(true);
          setError(null);
        };
        utterance.onend = () => {
          if (stopRequestedRef.current || sequenceId !== sequenceIdRef.current) {
            setIsSpeaking(false);
            stopRequestedRef.current = false;
            return;
          }
          index += 1;
          if (index >= parts.length) {
            setIsSpeaking(false);
            return;
          }
          sequenceTimerRef.current = window.setTimeout(speakNext, pauseMs);
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
      };

      speakNext();
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
    speakSequence,
    stop,
  };
}
