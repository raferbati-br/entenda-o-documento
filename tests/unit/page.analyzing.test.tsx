/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

vi.mock("framer-motion", async () => {
  return {
    motion: {
      div: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    },
    AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  };
});

vi.mock("@mui/material", async () => {
  const Wrap = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Box: Wrap,
    Button: ({ children, onClick }: { children?: ReactNode; onClick?: () => void }) => (
      <button onClick={onClick}>{children}</button>
    ),
    Container: Wrap,
    Stack: Wrap,
    Typography: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    LinearProgress: () => <div>progress</div>,
  };
});

const mockReplace = vi.fn();
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

vi.mock("@/lib/captureIdStore", () => ({ loadCaptureId: () => "cap", clearCaptureId: vi.fn() }));
vi.mock("@/lib/resultStore", () => ({ saveResult: vi.fn() }));
vi.mock("@/lib/apiClient", () => ({
  postJsonWithSession: vi.fn(async (url: string) => {
    if (url === "/api/ocr") {
      return { res: { ok: true, status: 200 }, data: { ok: true, documentText: "texto" } };
    }
    return { res: { ok: true, status: 200 }, data: { ok: true, result: { confidence: 1, cards: [], notice: "" } } };
  }),
}));
vi.mock("@/lib/qaContextStore", () => ({ clearQaContext: vi.fn(), saveQaContext: vi.fn() }));
vi.mock("@/lib/latencyTrace", () => ({ markLatencyTrace: vi.fn(), recordLatencyStep: vi.fn() }));
vi.mock("@/lib/telemetry", () => ({ telemetryCapture: vi.fn() }));
vi.mock("@/lib/errorMesages", () => ({ buildAnalyzeFriendlyError: vi.fn() }));
vi.mock("@/lib/typeGuards", () => ({ isRecord: () => true }));

vi.mock("@mui/icons-material/AutoAwesomeRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/CameraAltRounded", () => ({ default: () => null }));

vi.mock("@/app/_components/PageLayout", () => ({ default: ({ children }: { children?: ReactNode }) => <div>{children}</div> }));
vi.mock("@/app/_components/Notice", () => ({ default: ({ children }: { children?: ReactNode }) => <div>{children}</div> }));

import AnalyzingPage from "@/app/analyzing/page";

function render(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe("AnalyzingPage", () => {
  beforeEach(() => {
    mockReplace.mockReset();
  });

  it("renders loading state", () => {
    const { container } = render(<AnalyzingPage />);
    expect(container.textContent).toContain("Lendo o documento");
  });
});
