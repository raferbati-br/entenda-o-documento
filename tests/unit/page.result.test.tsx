/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

vi.mock("@mui/material", async () => {
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

vi.mock("@mui/material/styles", () => ({ alpha: () => "rgba(0,0,0,0.1)" }));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/resultStore", () => ({ loadResult: () => ({ confidence: 0.8, cards: [], notice: "" }) }));
vi.mock("@/lib/qaContextStore", () => ({ loadQaContext: () => "" }));
vi.mock("@/lib/latencyTrace", () => ({ clearLatencyTrace: vi.fn(), getLatencyTraceSnapshot: () => null }));
vi.mock("@/lib/telemetry", () => ({ telemetryCapture: vi.fn() }));
vi.mock("@/lib/errorMesages", () => ({ mapFeedbackError: vi.fn(), mapNetworkError: vi.fn() }));
vi.mock("@/lib/apiClient", () => ({ postJsonWithSession: vi.fn() }));
vi.mock("@/lib/analysisSession", () => ({ resetAnalysisSession: vi.fn() }));
vi.mock("@/lib/hooks/useJumpToEnd", () => ({
  useJumpToEnd: () => ({ endRef: { current: null }, showJump: false, updateJumpState: vi.fn(), handleScroll: vi.fn(), jumpToEnd: vi.fn() }),
}));
vi.mock("@/lib/hooks/useSpeechSynthesis", () => ({
  useSpeechSynthesis: () => ({ supported: false, isSpeaking: false, error: null, setError: vi.fn(), speak: vi.fn(), speakSequence: vi.fn(), stop: vi.fn() }),
}));

vi.mock("@/app/_components/SectionBlock", () => ({ default: () => <div>section</div> }));
vi.mock("@/app/_components/FooterActions", () => ({ default: () => <div>footer</div> }));
vi.mock("@/app/_components/BackHeader", () => ({ default: ({ title }: { title?: ReactNode }) => <div>{title}</div> }));
vi.mock("@/app/_components/PageLayout", () => ({ default: ({ children }: { children?: ReactNode }) => <div>{children}</div> }));
vi.mock("@/app/_components/Notice", () => ({ default: ({ children }: { children?: ReactNode }) => <div>{children}</div> }));
vi.mock("@/app/_components/FeedbackActions", () => ({ default: () => <div>feedback</div> }));

vi.mock("@mui/icons-material/StopCircleRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/DescriptionRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/InfoRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/EventRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/ListAltRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/HelpOutlineRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/CameraAltRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/WarningRounded", () => ({ default: () => null }));
vi.mock("@mui/icons-material/VolumeUpRounded", () => ({ default: () => null }));

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
