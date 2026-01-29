import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

type Options = {
  scrollRef?: RefObject<HTMLElement | null>;
  threshold?: number;
  onAtBottomChange?: (atBottom: boolean) => void;
};

function getScrollTarget(scrollRef?: RefObject<HTMLElement | null>): HTMLElement | null {
  const node = scrollRef?.current;
  if (node && node.scrollHeight > node.clientHeight) return node;
  if (typeof document === "undefined") return null;
  return document.documentElement;
}

export function useJumpToEnd(options: Options = {}) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const [showJump, setShowJump] = useState(false);
  const onAtBottomChangeRef = useRef(options.onAtBottomChange);
  const threshold = options.threshold ?? 24;

  useEffect(() => {
    onAtBottomChangeRef.current = options.onAtBottomChange;
  }, [options.onAtBottomChange]);

  const updateJumpState = useCallback(() => {
    const target = getScrollTarget(options.scrollRef);
    if (!target) return;
    const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;
    setShowJump(!atBottom);
    onAtBottomChangeRef.current?.(atBottom);
  }, [options.scrollRef, threshold]);

  const handleScroll = useCallback(() => {
    updateJumpState();
  }, [updateJumpState]);

  const jumpToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setShowJump(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleWindowScroll = () => updateJumpState();
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [updateJumpState]);

  return {
    endRef,
    showJump,
    updateJumpState,
    handleScroll,
    jumpToEnd,
  };
}
