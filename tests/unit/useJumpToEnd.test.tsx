/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { useJumpToEnd } from "@/lib/hooks/useJumpToEnd";

type HookApi = ReturnType<typeof useJumpToEnd>;

function render(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe("useJumpToEnd", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("toggles showJump based on scroll position", () => {
    let api: HookApi | null = null;
    const scrollTarget = document.createElement("div");
    Object.defineProperty(scrollTarget, "scrollHeight", { value: 200, configurable: true });
    Object.defineProperty(scrollTarget, "clientHeight", { value: 100, configurable: true });
    Object.defineProperty(scrollTarget, "scrollTop", { value: 0, writable: true, configurable: true });

    const scrollRef = { current: scrollTarget };
    const onAtBottomChange = vi.fn();

    function Harness() {
      const hook = useJumpToEnd({ scrollRef, onAtBottomChange, threshold: 10 });
      useEffect(() => {
        api = hook;
      }, [hook]);
      return null;
    }

    render(<Harness />);

    act(() => {
      api!.updateJumpState();
    });

    expect(api!.showJump).toBe(true);
    expect(onAtBottomChange).toHaveBeenCalledWith(false);

    scrollTarget.scrollTop = 120;
    act(() => {
      api!.updateJumpState();
    });

    expect(api!.showJump).toBe(false);
    expect(onAtBottomChange).toHaveBeenCalledWith(true);
  });

  it("scrolls to end and hides jump button", () => {
    let api: HookApi | null = null;
    const endTarget = document.createElement("div");
    const scrollIntoView = vi.fn();
    endTarget.scrollIntoView = scrollIntoView;

    function Harness() {
      const hook = useJumpToEnd();
      useEffect(() => {
        api = hook;
      }, [hook]);
      return null;
    }

    render(<Harness />);

    act(() => {
      api!.endRef.current = endTarget;
      api!.jumpToEnd();
    });

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "end" });
    expect(api!.showJump).toBe(false);
  });

  it("uses document element when no scrollRef provided", () => {
    let api: HookApi | null = null;
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 200, configurable: true });
    Object.defineProperty(document.documentElement, "clientHeight", { value: 100, configurable: true });
    Object.defineProperty(document.documentElement, "scrollTop", { value: 0, writable: true, configurable: true });

    function Harness() {
      const hook = useJumpToEnd();
      useEffect(() => {
        api = hook;
      }, [hook]);
      return null;
    }

    render(<Harness />);
    act(() => {
      api!.handleScroll();
    });

    expect(api!.showJump).toBe(true);
  });

  it("falls back to document element when scrollRef is not scrollable", () => {
    let api: HookApi | null = null;
    const scrollTarget = document.createElement("div");
    Object.defineProperty(scrollTarget, "scrollHeight", { value: 100, configurable: true });
    Object.defineProperty(scrollTarget, "clientHeight", { value: 100, configurable: true });

    Object.defineProperty(document.documentElement, "scrollHeight", { value: 300, configurable: true });
    Object.defineProperty(document.documentElement, "clientHeight", { value: 100, configurable: true });
    Object.defineProperty(document.documentElement, "scrollTop", { value: 0, writable: true, configurable: true });

    function Harness() {
      const hook = useJumpToEnd({ scrollRef: { current: scrollTarget } });
      useEffect(() => {
        api = hook;
      }, [hook]);
      return null;
    }

    render(<Harness />);
    act(() => {
      api!.handleScroll();
    });

    expect(api!.showJump).toBe(true);
  });

  it("handles missing document safely", () => {
    let api: HookApi | null = null;

    function Harness() {
      const hook = useJumpToEnd();
      useEffect(() => {
        api = hook;
      }, [hook]);
      return null;
    }

    render(<Harness />);
    const originalDocument = globalThis.document;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).document = undefined;
    act(() => {
      api!.updateJumpState();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).document = originalDocument;
    expect(api!.showJump).toBe(false);
  });

});
