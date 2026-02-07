/** @jest-environment jsdom */
import type { ReactElement, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

jest.mock("framer-motion", () => {
  return {
    motion: {
      div: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    },
    AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  };
});

jest.mock("@mui/material", () => {
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

const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

jest.mock("@/lib/captureIdStore", () => ({ loadCaptureId: () => "cap", clearCaptureId: jest.fn() }));
jest.mock("@/lib/resultStore", () => ({ saveResult: jest.fn() }));
jest.mock("@/lib/apiClient", () => ({
  postJsonWithSession: jest.fn(async (url: string) => {
    if (url === "/api/ocr") {
      return { res: { ok: true, status: 200 }, data: { ok: true, documentText: "texto" } };
    }
    return { res: { ok: true, status: 200 }, data: { ok: true, result: { confidence: 1, cards: [], notice: "" } } };
  }),
}));
jest.mock("@/lib/qaContextStore", () => ({ clearQaContext: jest.fn(), saveQaContext: jest.fn() }));
jest.mock("@/lib/latencyTrace", () => ({ markLatencyTrace: jest.fn(), recordLatencyStep: jest.fn() }));
jest.mock("@/lib/telemetry", () => ({ telemetryCapture: jest.fn() }));
jest.mock("@/lib/errorMesages", () => ({ buildAnalyzeFriendlyError: jest.fn() }));
jest.mock("@/lib/typeGuards", () => ({ isRecord: () => true }));

jest.mock("@mui/icons-material/AutoAwesomeRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/CameraAltRounded", () => ({ default: () => null }));

jest.mock("@/app/_components/PageLayout", () => ({
  default: ({ children, header, footer }: { children?: ReactNode; header?: ReactNode; footer?: ReactNode }) => (
    <div>
      {header}
      {children}
      {footer}
    </div>
  ),
}));
jest.mock("@/app/_components/Notice", () => ({ default: ({ children }: { children?: ReactNode }) => <div>{children}</div> }));

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
