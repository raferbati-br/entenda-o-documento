/** @jest-environment jsdom */
import type { ReactElement, ReactNode } from "react";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import { act } from "react";

jest.mock("@mui/material", () => {
  const Wrap = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Box: Wrap,
    ButtonBase: ({ children }: { children?: ReactNode }) => <button>{children}</button>,
    CircularProgress: () => <div>loading</div>,
    Container: Wrap,
    Divider: Wrap,
    Dialog: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    Fab: ({ children }: { children?: ReactNode }) => <button>{children}</button>,
    IconButton: ({ children }: { children?: ReactNode }) => <button>{children}</button>,
    Stack: Wrap,
    SvgIcon: ({ children }: { children?: ReactNode }) => <svg>{children}</svg>,
    TextField: () => <input />,
    Typography: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  };
});

jest.mock("@mui/material/styles", () => ({ alpha: () => "rgba(0,0,0,0.1)" }));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/qaContextStore", () => ({ loadQaContext: () => "" }));
jest.mock("@/lib/resultStore", () => ({ loadResult: () => ({ confidence: 0.8, cards: [], notice: "" }) }));
jest.mock("@/lib/telemetry", () => ({ telemetryCapture: jest.fn() }));
jest.mock("@/lib/errorMesages", () => ({ mapFeedbackError: jest.fn(), mapNetworkError: jest.fn(), mapQaError: jest.fn() }));
jest.mock("@/lib/qaStream", () => ({ readQaStream: jest.fn() }));
jest.mock("@/lib/apiClient", () => ({ postJsonWithSession: jest.fn(), postJsonWithSessionResponse: jest.fn() }));
jest.mock("@/lib/analysisSession", () => ({ resetAnalysisSession: jest.fn() }));
jest.mock("@/lib/hooks/useCaptureObjectUrl", () => ({ useCaptureObjectUrl: () => ({ url: "data:image/png;base64,abc" }) }));
jest.mock("@/lib/hooks/useJumpToEnd", () => ({
  useJumpToEnd: () => ({ endRef: { current: null }, showJump: false, updateJumpState: jest.fn(), handleScroll: jest.fn(), jumpToEnd: jest.fn() }),
}));
jest.mock("@/lib/hooks/useSpeechSynthesis", () => ({
  useSpeechSynthesis: () => ({ supported: false, isSpeaking: false, speak: jest.fn(), stop: jest.fn() }),
}));
jest.mock("@/lib/qaLimits", () => ({ MAX_CONTEXT_CHARS: 1000, MAX_QUESTION_CHARS: 200, MIN_QUESTION_CHARS: 4 }));

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
jest.mock("@/app/_components/FeedbackActions", () => ({ default: () => <div>feedback</div> }));
jest.mock("@/app/_components/IconTextRow", () => ({ default: () => <div>icon-row</div> }));
jest.mock("@/app/_components/PinchZoomImage", () => ({ default: () => <div>image</div> }));

jest.mock("@mui/icons-material/DescriptionRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/HelpOutlineRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/PaidRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/ScheduleRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/CameraAltRounded", () => ({ default: () => null }));
jest.mock("@mui/icons-material/SendRounded", () => ({ default: () => null }));

import PerguntasPage from "@/app/perguntas/page";

class NoopResizeObserver {
  observe() {}
  disconnect() {}
}

function render(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe("PerguntasPage", () => {
  let root: Root | null = null;

  beforeEach(() => {
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    };
    globalThis.cancelAnimationFrame = () => {};
    globalThis.ResizeObserver = NoopResizeObserver as typeof ResizeObserver;
  });

  afterEach(() => {
    root?.unmount();
    root = null;
    document.body.innerHTML = "";
  });

  it("renders empty state", () => {
    const rendered = render(<PerguntasPage />);
    root = rendered.root;
    const { container } = rendered;
    expect(container.textContent).toContain("Tire suas duvidas");
  });
});
