/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

vi.mock("@mui/material", async () => {
  const Wrap = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Box: Wrap,
    Divider: Wrap,
    Stack: Wrap,
    Typography: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  };
});

vi.mock("next/link", async () => {
  return {
    default: ({ children, href }: { children?: ReactNode; href?: string }) => <a href={href ?? "#"}>{children}</a>,
  };
});

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockTelemetry = vi.fn();
vi.mock("@/lib/telemetry", () => ({ telemetryCapture: (...args: unknown[]) => mockTelemetry(...args) }));

const mockOpenGallery = vi.fn();
const mockOnFileChange = vi.fn();
vi.mock("@/lib/hooks/useCaptureInput", () => ({
  useCaptureInput: () => ({
    galleryInputRef: { current: null },
    openGallery: mockOpenGallery,
    onFileChange: mockOnFileChange,
  }),
}));

vi.mock("@/app/_components/IconTextRow", () => ({ default: () => <div>icon-row</div> }));
vi.mock("@/app/_components/FooterActions", () => ({ default: () => <div>footer-actions</div> }));
vi.mock("@/app/_components/PageLayout", () => ({
  default: ({ children, header, footer }: { children?: ReactNode; header?: ReactNode; footer?: ReactNode }) => (
    <div>
      {header}
      {children}
      {footer}
    </div>
  ),
}));

vi.mock("@mui/icons-material/AutoAwesomeRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/LockRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/DescriptionRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/CameraAltRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/PhotoLibraryRounded", () => ({ default: () => null }));

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
