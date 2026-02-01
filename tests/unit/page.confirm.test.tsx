/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

vi.mock("@mui/material", async () => {
  const Wrap = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Typography: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    CircularProgress: () => <div>loading</div>,
    Backdrop: Wrap,
  };
});

const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock("@/lib/captureIdStore", () => ({ saveCaptureId: vi.fn() }));
vi.mock("@/lib/captureStore", () => ({ loadCapture: vi.fn(), clearCapture: vi.fn() }));
vi.mock("@/lib/imageCompression", () => ({ compressBlobToDataUrl: vi.fn() }));
vi.mock("@/lib/apiClient", () => ({ postJsonWithSession: vi.fn() }));
vi.mock("@/lib/latencyTrace", () => ({ recordLatencyStep: vi.fn(), startLatencyTrace: vi.fn() }));
vi.mock("@/lib/telemetry", () => ({ telemetryCapture: vi.fn() }));
vi.mock("@/lib/errorMesages", () => ({ mapCaptureError: vi.fn(), mapNetworkError: vi.fn() }));
vi.mock("@/lib/hooks/useCaptureObjectUrl", () => ({
  useCaptureObjectUrl: () => ({ url: "data:image/png;base64,abc" }),
}));

vi.mock("@/app/_components/FooterActions", () => ({ default: () => <div>footer-actions</div> }));
vi.mock("@/app/_components/BackHeader", () => ({ default: ({ title }: { title?: ReactNode }) => <div>{title}</div> }));
vi.mock("@/app/_components/PageLayout", () => ({
  default: ({ children, header, footer }: { children?: ReactNode; header?: ReactNode; footer?: ReactNode }) => (
    <div>
      {header}
      {children}
      {footer}
    </div>
  ),
}));
vi.mock("@/app/_components/Notice", () => ({ default: ({ children }: { children?: ReactNode }) => <div>{children}</div> }));
vi.mock("@/app/_components/PinchZoomImage", () => ({ default: () => <div>image</div> }));

vi.mock("@mui/icons-material/CheckCircleRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/ReplayRounded", () => ({ default: () => null }));

import ConfirmPage from "@/app/confirm/page";

function render(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe("ConfirmPage", () => {
  it("renders header", () => {
    const { container } = render(<ConfirmPage />);
    expect(container.textContent).toContain("Confira a imagem");
  });
});
