/** @jest-environment jsdom */
import type { ReactElement, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

jest.mock("@mui/material", () => {
  const Wrap = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Box: Wrap,
    Divider: Wrap,
    Stack: Wrap,
    Typography: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  };
});

jest.mock("next/link", () => {
  return {
    default: ({ children, href }: { children?: ReactNode; href?: string }) => <a href={href ?? "#"}>{children}</a>,
  };
});

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockTelemetry = jest.fn();
jest.mock("@/lib/telemetry", () => ({ telemetryCapture: (...args: unknown[]) => mockTelemetry(...args) }));

const mockOpenGallery = jest.fn();
const mockOnFileChange = jest.fn();
jest.mock("@/lib/hooks/useCaptureInput", () => ({
  useCaptureInput: () => ({
    galleryInputRef: { current: null },
    openGallery: mockOpenGallery,
    onFileChange: mockOnFileChange,
  }),
}));

jest.mock("@/app/_components/IconTextRow", () => ({ default: () => <div>icon-row</div> }));
jest.mock("@/app/_components/FooterActions", () => ({ default: () => <div>footer-actions</div> }));
jest.mock("@/app/_components/PageLayout", () => ({
  default: ({ children, header, footer }: { children?: ReactNode; header?: ReactNode; footer?: ReactNode }) => (
    <div>
      {header}
      {children}
      {footer}
    </div>
  ),
}));

jest.mock("@mui/icons-material/AutoAwesomeRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/LockRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/DescriptionRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/CameraAltRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/PhotoLibraryRounded", () => ({ default: () => null }));

import HomePage from "@/app/page";

function render(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe("HomePage", () => {
  beforeEach(() => {
    mockTelemetry.mockReset();
  });

  it("renders hero content", () => {
    const { container } = render(<HomePage />);
    expect(container.textContent).toContain("Entenda qualquer documento");
  });
});
