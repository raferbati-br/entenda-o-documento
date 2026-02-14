/** @jest-environment jsdom */
import type { ReactElement, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

jest.mock("@mui/material-nextjs/v15-appRouter", () => {
  return {
    AppRouterCacheProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
});

const mockAccessibilityProvider = jest.fn(({ children }: { children: ReactNode }) => <>{children}</>);
jest.mock("@/app/acessibilidade/AccessibilityContext", () => ({
  AccessibilityProvider: (props: { children: ReactNode }) => mockAccessibilityProvider(props),
}));

const mockEnsureSessionToken = jest.fn();
jest.mock("@/lib/sessionToken", () => ({
  ensureSessionToken: () => mockEnsureSessionToken(),
}));

const mockCapture = jest.fn();
const mockInit = jest.fn();
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    init: (...args: unknown[]) => mockInit(...args),
    capture: (...args: unknown[]) => mockCapture(...args),
  },
}));

const mockUsePathname = jest.fn();
const mockUseSearchParams = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
}));

import Providers from "@/app/providers";

function render(ui: ReactElement) {
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
    mockAccessibilityProvider.mockClear();
    mockEnsureSessionToken.mockReset();
    mockEnsureSessionToken.mockResolvedValue(undefined);
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

  it("renders children within accessibility provider", () => {
    mockUsePathname.mockReturnValue("/");
    mockUseSearchParams.mockReturnValue({ toString: () => "" });

    render(
      <Providers>
        <div>child</div>
      </Providers>
    );

    expect(mockAccessibilityProvider).toHaveBeenCalledTimes(1);
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
