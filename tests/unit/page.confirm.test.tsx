/** @jest-environment jsdom */
import type { ReactElement, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

jest.mock("@mui/material", () => {
  const Wrap = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Typography: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    CircularProgress: () => <div>loading</div>,
    Backdrop: Wrap,
  };
});

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("@/lib/captureIdStore", () => ({ saveCaptureId: jest.fn() }));
jest.mock("@/lib/captureStore", () => ({ loadCapture: jest.fn(), clearCapture: jest.fn() }));
jest.mock("@/lib/imageCompression", () => ({ compressBlobToDataUrl: jest.fn() }));
jest.mock("@/lib/apiClient", () => ({ postJsonWithSession: jest.fn() }));
jest.mock("@/lib/latencyTrace", () => ({ recordLatencyStep: jest.fn(), startLatencyTrace: jest.fn() }));
jest.mock("@/lib/telemetry", () => ({ telemetryCapture: jest.fn() }));
jest.mock("@/lib/errorMesages", () => ({ mapCaptureError: jest.fn(), mapNetworkError: jest.fn() }));
jest.mock("@/lib/hooks/useCaptureObjectUrl", () => ({
  useCaptureObjectUrl: () => ({ url: "data:image/png;base64,abc" }),
}));

jest.mock("@/app/_components/FooterActions", () => ({ default: () => <div>footer-actions</div> }));
jest.mock("@/app/_components/BackHeader", () => ({ default: ({ title }: { title?: ReactNode }) => <div>{title}</div> }));
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
jest.mock("@/app/_components/PinchZoomImage", () => ({ default: () => <div>image</div> }));

jest.mock("@mui/icons-material/CheckCircleRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/ReplayRounded", () => ({ default: () => null }));

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
