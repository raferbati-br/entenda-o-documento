/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

vi.mock("@mui/material", async () => {
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

vi.mock("@mui/material/styles", () => ({ alpha: () => "rgba(0,0,0,0.1)" }));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/qaContextStore", () => ({ loadQaContext: () => "" }));
vi.mock("@/lib/resultStore", () => ({ loadResult: () => ({ confidence: 0.8, cards: [], notice: "" }) }));
vi.mock("@/lib/telemetry", () => ({ telemetryCapture: vi.fn() }));
vi.mock("@/lib/errorMesages", () => ({ mapFeedbackError: vi.fn(), mapNetworkError: vi.fn(), mapQaError: vi.fn() }));
vi.mock("@/lib/qaStream", () => ({ readQaStream: vi.fn() }));
vi.mock("@/lib/apiClient", () => ({ postJsonWithSession: vi.fn(), postJsonWithSessionResponse: vi.fn() }));
vi.mock("@/lib/analysisSession", () => ({ resetAnalysisSession: vi.fn() }));
vi.mock("@/lib/hooks/useCaptureObjectUrl", () => ({ useCaptureObjectUrl: () => ({ url: "data:image/png;base64,abc" }) }));
vi.mock("@/lib/hooks/useJumpToEnd", () => ({
  useJumpToEnd: () => ({ endRef: { current: null }, showJump: false, updateJumpState: vi.fn(), handleScroll: vi.fn(), jumpToEnd: vi.fn() }),
}));
vi.mock("@/lib/hooks/useSpeechSynthesis", () => ({
  useSpeechSynthesis: () => ({ supported: false, isSpeaking: false, speak: vi.fn(), stop: vi.fn() }),
}));
vi.mock("@/lib/qaLimits", () => ({ MAX_CONTEXT_CHARS: 1000, MAX_QUESTION_CHARS: 200, MIN_QUESTION_CHARS: 4 }));

vi.mock("@/app/_components/FooterActions", () => ({ default: () => <div>footer-actions</div> }));
vi.mock("@/app/_components/BackHeader", () => ({ default: ({ title }: { title?: ReactNode }) => <div>{title}</div> }));
vi.mock("@/app/_components/PageLayout", () => ({ default: ({ children }: { children?: ReactNode }) => <div>{children}</div> }));
vi.mock("@/app/_components/Notice", () => ({ default: ({ children }: { children?: ReactNode }) => <div>{children}</div> }));
vi.mock("@/app/_components/FeedbackActions", () => ({ default: () => <div>feedback</div> }));
vi.mock("@/app/_components/IconTextRow", () => ({ default: () => <div>icon-row</div> }));
vi.mock("@/app/_components/PinchZoomImage", () => ({ default: () => <div>image</div> }));

vi.mock("@mui/icons-material/DescriptionRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/HelpOutlineRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/PaidRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/ScheduleRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/CameraAltRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/SendRounded", () => ({ default: () => null }));

import PerguntasPage from "@/app/perguntas/page";

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
  it("renders empty state", () => {
    const { container } = render(<PerguntasPage />);
    expect(container.textContent).toContain("Tire suas duvidas");
  });
});
