/** @jest-environment jsdom */
import type { ReactElement, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

jest.mock("@mui/material", () => {
  const Wrap = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Box: Wrap,
    Button: ({ children }: { children?: ReactNode }) => <button>{children}</button>,
    Chip: ({ label }: { label?: ReactNode }) => <div>{label}</div>,
    Divider: Wrap,
    Fab: ({ children }: { children?: ReactNode }) => <button>{children}</button>,
    Stack: Wrap,
    SvgIcon: ({ children }: { children?: ReactNode }) => <svg>{children}</svg>,
    Typography: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    Snackbar: ({ message }: { message?: ReactNode }) => <div>{message}</div>,
  };
});

jest.mock("@mui/material/styles", () => ({ alpha: () => "rgba(0,0,0,0.1)" }));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/resultStore", () => ({ loadResult: () => ({ confidence: 0.8, cards: [], notice: "" }) }));
jest.mock("@/lib/qaContextStore", () => ({ loadQaContext: () => "" }));
jest.mock("@/lib/latencyTrace", () => ({ clearLatencyTrace: jest.fn(), getLatencyTraceSnapshot: () => null }));
jest.mock("@/lib/telemetry", () => ({ telemetryCapture: jest.fn() }));
jest.mock("@/lib/errorMesages", () => ({ mapFeedbackError: jest.fn(), mapNetworkError: jest.fn() }));
jest.mock("@/lib/apiClient", () => ({ postJsonWithSession: jest.fn() }));
jest.mock("@/lib/analysisSession", () => ({ resetAnalysisSession: jest.fn() }));
jest.mock("@/lib/hooks/useJumpToEnd", () => ({
  useJumpToEnd: () => ({ endRef: { current: null }, showJump: false, updateJumpState: jest.fn(), handleScroll: jest.fn(), jumpToEnd: jest.fn() }),
}));
jest.mock("@/lib/hooks/useSpeechSynthesis", () => ({
  useSpeechSynthesis: () => ({ supported: false, isSpeaking: false, error: null, setError: jest.fn(), speak: jest.fn(), speakSequence: jest.fn(), stop: jest.fn() }),
}));

jest.mock("@/app/_components/SectionBlock", () => ({ default: () => <div>section</div> }));
jest.mock("@/app/_components/FooterActions", () => ({ default: () => <div>footer</div> }));
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
jest.mock("@/app/_components/FeedbackActions", () => ({ default: () => <div>feedback</div> }));

jest.mock("@mui/icons-material/StopCircleRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/DescriptionRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/InfoRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/EventRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/ListAltRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/HelpOutlineRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/CameraAltRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/WarningRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/VolumeUpRounded", () => ({ default: () => null }));

import ResultPage from "@/app/result/page";

function render(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe("ResultPage", () => {
  it("renders header", () => {
    const { container } = render(<ResultPage />);
    expect(container.textContent).toContain("Explica");
  });
});
