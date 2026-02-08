/** @jest-environment jsdom */
import type { ReactElement, ReactNode, ButtonHTMLAttributes } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

jest.mock("@mui/material", () => {
  return {
    CssBaseline: () => null,
    ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    useMediaQuery: jest.fn(() => false),
    Box: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Paper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Button: (
      props: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; startIcon?: ReactNode; endIcon?: ReactNode }
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { children, startIcon, endIcon, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  };
});

jest.mock("@mui/material-nextjs/v15-appRouter", () => {
  return {
    AppRouterCacheProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
});

const mockEnsureSessionToken = jest.fn();
jest.mock("@/lib/sessionToken", () => ({
  ensureSessionToken: () => mockEnsureSessionToken(),
}));

const mockBuildTheme = jest.fn(() => ({ palette: { mode: "light" } }));
jest.mock("@/app/theme", () => ({
  buildTheme: (...args: unknown[]) => mockBuildTheme(...args),
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
    mockEnsureSessionToken.mockReset();
    mockEnsureSessionToken.mockResolvedValue(undefined);
    mockBuildTheme.mockClear();
    mockCapture.mockReset();
    mockInit.mockReset();
    mockUsePathname.mockReset();
    mockUseSearchParams.mockReset();
    window.localStorage.clear();
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

  it("restores accessibility preferences from storage", async () => {
    window.localStorage.setItem("eod_font_scale", "1.2");
    window.localStorage.setItem("eod_high_contrast", "true");
    mockUsePathname.mockReturnValue("/");
    mockUseSearchParams.mockReturnValue({ toString: () => "" });

    render(
      <Providers>
        <div>child</div>
      </Providers>
    );

    await act(async () => {});

    expect(document.documentElement.style.getPropertyValue("--font-scale")).toBe("1.2");
    expect(document.documentElement.dataset.contrast).toBe("high");
    expect(mockBuildTheme).toHaveBeenCalledWith("light", true);
  });
});
