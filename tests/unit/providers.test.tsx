/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

vi.mock("@mui/material", async () => {
  const React = await import("react");
  return {
    CssBaseline: () => null,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useMediaQuery: vi.fn(() => false),
    Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

vi.mock("@mui/material-nextjs/v15-appRouter", async () => {
  const React = await import("react");
  return {
    AppRouterCacheProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const mockEnsureSessionToken = vi.fn();
vi.mock("@/lib/sessionToken", () => ({
  ensureSessionToken: () => mockEnsureSessionToken(),
}));

const mockBuildTheme = vi.fn(() => ({ palette: { mode: "light" } }));
vi.mock("@/app/theme", () => ({
  buildTheme: (...args: unknown[]) => mockBuildTheme(...args),
}));

const mockCapture = vi.fn();
const mockInit = vi.fn();
vi.mock("posthog-js", () => ({
  default: {
    init: (...args: unknown[]) => mockInit(...args),
    capture: (...args: unknown[]) => mockCapture(...args),
  },
}));

const mockUsePathname = vi.fn();
const mockUseSearchParams = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
}));

import Providers from "@/app/providers";

function render(ui: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe("Providers", () => {
  beforeEach(() => {
    mockEnsureSessionToken.mockReset();
    mockBuildTheme.mockClear();
    mockCapture.mockReset();
    mockInit.mockReset();
    mockUsePathname.mockReset();
    mockUseSearchParams.mockReset();
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("ensures session token on mount", () => {
    mockUsePathname.mockReturnValue("/");
    mockUseSearchParams.mockReturnValue({ toString: () => "" });

    render(
      <Providers>
        <div>child</div>
      </Providers>
    );

    expect(mockEnsureSessionToken).toHaveBeenCalledTimes(1);
  });

  it("initializes and captures posthog when key is present", () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "key";
    mockUsePathname.mockReturnValue("/perguntas");
    mockUseSearchParams.mockReturnValue({ toString: () => "q=1" });

    render(
      <Providers>
        <div>child</div>
      </Providers>
    );

    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockCapture).toHaveBeenCalledWith("page_view", { path: "/perguntas", search: "q=1" });
  });
});
