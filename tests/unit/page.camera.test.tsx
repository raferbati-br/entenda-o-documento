/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

vi.mock("@mui/material", async () => {
  const Wrap = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Box: Wrap,
    Stack: Wrap,
    Typography: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    CircularProgress: () => <div>loading</div>,
  };
});

const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

vi.mock("@/lib/telemetry", () => ({ telemetryCapture: vi.fn() }));
vi.mock("@/lib/hooks/useCaptureInput", () => ({
  useCaptureInput: () => ({
    cameraInputRef: { current: null },
    galleryInputRef: { current: null },
    openCamera: vi.fn(),
    openGallery: vi.fn(),
    onFileChange: vi.fn(),
  }),
}));

vi.mock("@/app/_components/IconTextRow", () => ({ default: () => <div>icon-row</div> }));
vi.mock("@/app/_components/FooterActions", () => ({ default: () => <div>footer-actions</div> }));
vi.mock("@/app/_components/BackHeader", () => ({ default: () => <div>back-header</div> }));
vi.mock("@/app/_components/PageLayout", () => ({ default: ({ children }: { children?: ReactNode }) => <div>{children}</div> }));
vi.mock("@/app/_components/Notice", () => ({ default: ({ children }: { children?: ReactNode }) => <div>{children}</div> }));

vi.mock("@mui/icons-material/CameraAltRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/PhotoLibraryRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/LightModeRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/CropFreeRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/TextFieldsRounded", () => ({ default: () => null }));

import CameraPage from "@/app/camera/page";

function render(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe("CameraPage", () => {
  it("renders guidance text", () => {
    const { container } = render(<CameraPage />);
    expect(container.textContent).toContain("Vamos preparar a c");
  });
});
