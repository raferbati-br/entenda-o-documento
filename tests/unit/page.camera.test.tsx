/** @jest-environment jsdom */
import type { ReactElement, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

jest.mock("@mui/material", () => {
  const Wrap = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Box: Wrap,
    Stack: Wrap,
    Typography: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    CircularProgress: () => <div>loading</div>,
  };
});

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock("@/lib/telemetry", () => ({ telemetryCapture: jest.fn() }));
jest.mock("@/lib/hooks/useCaptureInput", () => ({
  useCaptureInput: () => ({
    cameraInputRef: { current: null },
    galleryInputRef: { current: null },
    openCamera: jest.fn(),
    openGallery: jest.fn(),
    onFileChange: jest.fn(),
  }),
}));

jest.mock("@/app/_components/IconTextRow", () => ({ default: () => <div>icon-row</div> }));
jest.mock("@/app/_components/FooterActions", () => ({ default: () => <div>footer-actions</div> }));
jest.mock("@/app/_components/BackHeader", () => ({ default: () => <div>back-header</div> }));
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

jest.mock("@mui/icons-material/CameraAltRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/PhotoLibraryRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/LightModeRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/CropFreeRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/TextFieldsRounded", () => ({ default: () => null }));

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
