"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadQaContext } from "@/lib/qaContextStore";
import { loadResult, AnalysisResult } from "@/lib/resultStore";
import { telemetryCapture } from "@/lib/telemetry";
import { mapFeedbackError, mapNetworkError, mapQaError } from "@/lib/errorMesages";
import { readQaStream } from "@/lib/qaStream";
import { postJsonWithSession, postJsonWithSessionResponse } from "@/lib/apiClient";
import { resetAnalysisSession } from "@/lib/analysisSession";
import { useCaptureObjectUrl } from "@/lib/hooks/useCaptureObjectUrl";
import { useJumpToEnd } from "@/lib/hooks/useJumpToEnd";
import { useSpeechSynthesis } from "@/lib/hooks/useSpeechSynthesis";
import { MAX_CONTEXT_CHARS, MAX_QUESTION_CHARS, MIN_QUESTION_CHARS } from "@/lib/qaLimits";

import {
  Box,
  ButtonBase,
  CircularProgress,
  Container,
  Divider,
  Dialog,
  Fab,
  IconButton,
  Stack,
  SvgIcon,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import FooterActions from "../_components/FooterActions";
import BackHeader from "../_components/BackHeader";
import PageLayout from "../_components/PageLayout";
import Notice from "../_components/Notice";
import FeedbackActions from "../_components/FeedbackActions";
import IconTextRow from "../_components/IconTextRow";
import PinchZoomImage from "../_components/PinchZoomImage";

type CardT = { id: string; title: string; text: string };
type QaItem = {
  id: string;
  question: string;
  answer?: string;
  error?: string;
  pending?: boolean;
  feedbackChoice?: "up" | "down";
  feedbackReason?: string | null;
  feedback?: "up" | "down";
  feedbackLoading?: boolean;
  feedbackError?: string;
};

const ACTION_BAR_HEIGHT = 88;
const INPUT_BAR_GAP = 8;
const SCROLL_PAD_FALLBACK = ACTION_BAR_HEIGHT + INPUT_BAR_GAP + 96;
const KEYBOARD_OPEN_THRESHOLD = 120;

export default function PerguntasPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputBarRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);
  const prevLoadingRef = useRef(false);
  const initialViewportRef = useRef<number | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { url: imageUrl, error: imageError } = useCaptureObjectUrl({
    missingMessage: "Documento indisponivel para visualizacao.",
  });
  const { endRef, showJump, updateJumpState, handleScroll, jumpToEnd } = useJumpToEnd({
    scrollRef,
    onAtBottomChange: (atBottom) => {
      autoScrollRef.current = atBottom;
    },
  });
  const { supported: ttsSupported, isSpeaking, speak, stop } = useSpeechSynthesis({
    lang: "pt-BR",
    rate: 0.95,
  });

  const [docOpen, setDocOpen] = useState(false);

  const [question, setQuestion] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<QaItem[]>([]);
  const [scrollPad, setScrollPad] = useState(SCROLL_PAD_FALLBACK);
  const [inputBarHeight, setInputBarHeight] = useState(0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [speakingItemId, setSpeakingItemId] = useState<string | null>(null);

  const commonQuestions = useMemo(
    () => [
      "Qual e o prazo?",
      "Qual e o valor?",
      "O que este documento pede?",
      "Outras",
    ],
    []
  );

  const hasOcrContext = useMemo(() => Boolean(loadQaContext()?.trim()), []);
  const cardsArr = useMemo<CardT[]>(() => (result?.cards as CardT[]) || [], [result]);
  const cardMap = useMemo(() => Object.fromEntries(cardsArr.map((c) => [c.id, c])), [cardsArr]);
  const documentTitle = useMemo(() => cardMap["whatIs"]?.title || "Documento", [cardMap]);
  const confidence = result?.confidence ?? 0;
  const confidenceBucket = confidence < 0.45 ? "low" : confidence < 0.75 ? "medium" : "high";

  useEffect(() => {
    const res = loadResult();
    if (!res) {
      router.replace("/");
      return;
    }
    setResult(res);
  }, [router]);

  useEffect(() => {
    if (!result) return;
    telemetryCapture("qa_view", { contextSource: hasOcrContext ? "ocr" : "cards" });
  }, [result, hasOcrContext]);

  const qaContext = useMemo(() => {
    const cached = (loadQaContext() || "").trim();
    if (cached) return cached.slice(0, MAX_CONTEXT_CHARS);

    const parts = cardsArr
      .map((c) => {
        const title = (c?.title || "").trim();
        const text = (c?.text || "").trim();
        if (!title && !text) return "";
        return title ? `${title}: ${text}` : text;
      })
      .filter(Boolean);
    return parts.join("\n").slice(0, MAX_CONTEXT_CHARS);
  }, [cardsArr]);

  const canAsk = question.trim().length >= MIN_QUESTION_CHARS && !qaLoading;
  const isEmptyState = qaHistory.length === 0;
  const isKeyboardOpen = keyboardOffset > KEYBOARD_OPEN_THRESHOLD;
  const actionBarOffset = isKeyboardOpen ? -keyboardOffset : 0;
  const inputBarBottom = isKeyboardOpen ? INPUT_BAR_GAP : ACTION_BAR_HEIGHT + INPUT_BAR_GAP;
  const jumpButtonBottom = inputBarBottom + inputBarHeight + 8;

  useEffect(() => {
    if (!qaHistory.length) return;
    if (!autoScrollRef.current) return;
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      updateJumpState();
    });
  }, [qaHistory, updateJumpState, endRef]);

  useEffect(() => {
    if (prevLoadingRef.current && !qaLoading && qaHistory.length) {
      requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        updateJumpState();
      });
    }
    prevLoadingRef.current = qaLoading;
  }, [qaLoading, qaHistory.length, updateJumpState, endRef]);

  useEffect(() => {
    if (!inputBarRef.current) return;
    const node = inputBarRef.current;
    const updatePad = () => {
      const measured = Math.ceil(node.getBoundingClientRect().height);
      setInputBarHeight(measured);
      setScrollPad(measured + INPUT_BAR_GAP + 8);
    };
    updatePad();
    const observer = new ResizeObserver(updatePad);
    observer.observe(node);
    return () => observer.disconnect();
  }, [isEmptyState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewport = window.visualViewport;
    const getHeight = () => viewport?.height ?? window.innerHeight;
    if (!initialViewportRef.current) {
      initialViewportRef.current = getHeight();
    }
    const updateOffset = () => {
      const base = initialViewportRef.current ?? getHeight();
      const offset = Math.max(0, base - getHeight());
      setKeyboardOffset(offset);
    };
    updateOffset();
    const resizeTarget = viewport ?? window;
    resizeTarget.addEventListener("resize", updateOffset);
    return () => resizeTarget.removeEventListener("resize", updateOffset);
  }, []);

  useEffect(() => {
    if (isEmptyState) return;
    requestAnimationFrame(updateJumpState);
  }, [qaHistory.length, scrollPad, keyboardOffset, isEmptyState, updateJumpState]);


  function openDocument() {
    setDocOpen(true);
  }

  function closeDocument() {
    setDocOpen(false);
  }

  function stopSpeaking() {
    stop({ withMessage: false });
    setSpeakingItemId(null);
  }

  function speakAnswer(itemId: string, text: string) {
    if (!ttsSupported || !text) return;
    if (isSpeaking && speakingItemId === itemId) {
      stopSpeaking();
      return;
    }
    if (isSpeaking) {
      stop({ withMessage: false });
    }
    setSpeakingItemId(itemId);
    speak(text);
  }

  async function copyAnswer(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      telemetryCapture("qa_answer_copy");
    } catch (err) {
      console.warn("[qa] copy failed", err);
    }
  }

  async function shareAnswer(text: string) {
    if (!text) return;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      telemetryCapture("qa_answer_share");
    } catch (err) {
      console.warn("[qa] share failed", err);
    }
  }

  async function sendFeedback(itemId: string, helpful: boolean, reason?: string) {
    const item = qaHistory.find((entry) => entry.id === itemId);
    if (!item || item.feedback || item.feedbackLoading) return;
    if (!helpful && !reason) return;

    updateQaItem(itemId, {
      feedbackLoading: true,
      feedbackError: undefined,
      feedbackReason: helpful ? null : reason || null,
    });

    try {
      const { res, data } = await postJsonWithSession<{ ok?: boolean; error?: string }>("/api/feedback", {
        helpful,
        reason: helpful ? "" : reason || "",
        confidenceBucket,
        contextSource: hasOcrContext ? "ocr" : "cards",
      });
      if (!res.ok || !data?.ok) {
        const apiError = typeof data?.error === "string" ? data.error : "";
        throw new Error(mapFeedbackError(res.status, apiError));
      }

      updateQaItem(itemId, {
        feedback: helpful ? "up" : "down",
        feedbackChoice: helpful ? "up" : "down",
        feedbackLoading: false,
      });
      telemetryCapture(helpful ? "qa_answer_positive" : "qa_answer_negative");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      updateQaItem(itemId, { feedbackError: mapNetworkError(msg), feedbackLoading: false });
    }
  }

  function handleFeedbackUp(itemId: string) {
    const item = qaHistory.find((entry) => entry.id === itemId);
    if (!item || item.feedback || item.feedbackLoading) return;
    updateQaItem(itemId, { feedbackChoice: "up", feedbackReason: null, feedbackError: undefined });
    sendFeedback(itemId, true);
  }

  function handleFeedbackDown(itemId: string) {
    const item = qaHistory.find((entry) => entry.id === itemId);
    if (!item || item.feedback || item.feedbackLoading) return;
    updateQaItem(itemId, { feedbackChoice: "down", feedbackReason: null, feedbackError: undefined });
  }

  function newDoc() {
    stopSpeaking();
    resetAnalysisSession();
    router.push("/camera");
  }

  function handleQuickQuestion(q: string) {
    if (q === "Outras") {
      setQuestion("");
      inputRef.current?.focus();
      return;
    }
    setQuestion(q);
    inputRef.current?.focus();
  }

  function updateQaItem(id: string, updates: Partial<QaItem>) {
    setQaHistory((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }

  async function handleAsk() {
    const q = question.trim();
    if (!q || q.length < MIN_QUESTION_CHARS || q.length > MAX_QUESTION_CHARS) return;
    if (!qaContext) {
      setQaHistory((prev) => [
        ...prev,
        { id: `${Date.now()}-error`, question: q, error: "Nao foi possivel montar o contexto do documento." },
      ]);
      return;
    }

    const attemptKey = `qa_attempt:${q.toLowerCase()}`;
    const attempt = Number(sessionStorage.getItem(attemptKey) || "0") + 1;
    sessionStorage.setItem(attemptKey, String(attempt));

    const itemId = `qa-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    stopSpeaking();
    setQaHistory((prev) => [...prev, { id: itemId, question: q, pending: true, answer: "" }]);
    setQuestion("");
    setQaLoading(true);
    telemetryCapture("qa_question_submit", {
      contextSource: hasOcrContext ? "ocr" : "cards",
      length: q.length,
    });

    try {
      const res = await postJsonWithSessionResponse("/api/qa", { question: q, context: qaContext, attempt });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const apiError = typeof data?.error === "string" ? data.error : "";
        throw new Error(mapQaError(res.status, apiError));
      }

      if (!res.body) {
        throw new Error("Resposta vazia.");
      }

      let answerText = "";
      for await (const event of readQaStream(res.body)) {
        if (event.type === "delta") {
          answerText += event.text;
          updateQaItem(itemId, { answer: answerText, pending: true });
        }
        if (event.type === "error") {
          throw new Error(event.message || "Erro ao responder pergunta.");
        }
        if (event.type === "done") {
          break;
        }
      }

      updateQaItem(itemId, { pending: false });
      telemetryCapture("qa_answer_success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      updateQaItem(itemId, { pending: false, error: mapNetworkError(msg) });
      telemetryCapture("qa_answer_error");
    } finally {
      setQaLoading(false);
    }
  }

  if (!result) return null;

  return (
    <>
      <PageLayout
        contentPaddingBottom={isEmptyState ? 14 : 0}
        contentRef={scrollRef}
        onContentScroll={handleScroll}
        header={
          <BackHeader
            onBack={() => router.push("/result")}
            title={
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Tire suas duvidas
              </Typography>
            }
          />
        }
        footer={
          <FooterActions
            actionBarSx={{
              bottom: actionBarOffset,
              transition: "bottom 160ms ease-out",
            }}
            secondary={{
              label: "Ver documento",
              startIcon: <DescriptionRoundedIcon />,
              onClick: openDocument,
              disabled: !imageUrl,
              disableRipple: true,
              disableFocusRipple: true,
              sx: {
                "&.Mui-focusVisible": { bgcolor: "transparent" },
                "&:focus-visible": { bgcolor: "transparent" },
              },
            }}
            primary={{
              label: "Analisar outro",
              startIcon: <CameraAltRoundedIcon />,
              onClick: newDoc,
            }}
          />
        }
      >
        <Stack spacing={2} sx={{ minHeight: "100%" }}>
          <Box sx={{ flexGrow: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {isEmptyState ? (
              <Box
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  pt: 1,
                }}
              >
                <Stack spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="h4" gutterBottom fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
                    Tire suas duvidas sobre o documento
                  </Typography>
                  <Typography color="text.secondary" variant="body1" sx={{ lineHeight: 1.6 }}>
                    Escolha uma pergunta pronta ou escreva a sua.
                  </Typography>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1}>
                  {commonQuestions.map((q) => {
                    const iconColor =
                      q === "Qual e o prazo?"
                        ? "info.main"
                        : q === "Qual e o valor?"
                        ? "success.main"
                        : q === "O que este documento pede?"
                        ? "warning.main"
                        : "secondary.main";
                    const icon =
                      q === "Qual e o prazo?"
                        ? <ScheduleRoundedIcon fontSize="inherit" />
                        : q === "Qual e o valor?"
                        ? <PaidRoundedIcon fontSize="inherit" />
                        : q === "O que este documento pede?"
                        ? <DescriptionRoundedIcon fontSize="inherit" />
                        : <HelpOutlineRoundedIcon fontSize="inherit" />;
                    const description =
                      q === "Qual e o prazo?"
                        ? "Datas, prazos e o que vence primeiro."
                        : q === "Qual e o valor?"
                        ? "Valores, custos e possiveis multas."
                        : q === "O que este documento pede?"
                        ? "O pedido principal em poucas palavras."
                        : "Escreva sua propria pergunta.";
                    return (
                      <ButtonBase
                        key={q}
                        onClick={() => handleQuickQuestion(q)}
                        sx={{
                          textAlign: "left",
                          borderRadius: 2,
                          width: "fit-content",
                          alignSelf: "flex-start",
                          pl: 0.5,
                          pr: 2,
                          py: 0.5,
                          border: "1px solid",
                          borderColor: "divider",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Box>
                          <IconTextRow
                            icon={icon}
                            iconColor={iconColor}
                            title={q}
                            description={description}
                            compact
                          />
                        </Box>
                      </ButtonBase>
                    );
                  })}
                </Stack>
              </Box>
            ) : (
              <Box
                sx={{
                  flexGrow: 1,
                  minHeight: 0,
                  pr: 1,
                  mr: -1,
                  pb: `${scrollPad}px`,
                }}
              >
                <Stack spacing={1.5}>
                  {qaHistory.map((item) => {
                    const isItemSpeaking = isSpeaking && speakingItemId === item.id;
                    return (
                    <Stack key={item.id} spacing={1}>
                      <Box
                        sx={{
                          alignSelf: "flex-end",
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          maxWidth: "85%",
                        }}
                      >
                        <Typography variant="body2">{item.question}</Typography>
                      </Box>

                      {item.pending && !item.answer && (
                        <Box
                          sx={{
                            alignSelf: "flex-start",
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "action.hover",
                            maxWidth: "85%",
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="text.secondary">
                              Respondendo...
                            </Typography>
                          </Stack>
                        </Box>
                      )}

                      {item.answer && (
                        <Stack spacing={0.5} sx={{ alignSelf: "flex-start", maxWidth: "85%" }}>
                          <Box
                            sx={{
                              px: 2,
                              py: 1,
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              bgcolor: "background.paper",
                            }}
                          >
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                              {item.answer}
                            </Typography>
                          </Box>
                          <FeedbackActions
                            canCopy={Boolean(item.answer)}
                            canSpeak={ttsSupported && Boolean(item.answer)}
                            isSpeaking={isItemSpeaking}
                            onToggleSpeak={() => speakAnswer(item.id, item.answer ?? "")}
                            onCopy={() => copyAnswer(item.answer ?? "")}
                            onShare={() => shareAnswer(item.answer ?? "")}
                            feedbackChoice={item.feedbackChoice ?? null}
                            feedbackValue={item.feedback ?? null}
                            feedbackReason={item.feedbackReason ?? null}
                            feedbackSent={Boolean(item.feedback)}
                            feedbackLoading={Boolean(item.feedbackLoading)}
                            feedbackError={item.feedbackError ?? null}
                            onFeedbackUp={() => handleFeedbackUp(item.id)}
                            onFeedbackDown={() => handleFeedbackDown(item.id)}
                            onFeedbackReason={(reason) => sendFeedback(item.id, false, reason)}
                          />
                        </Stack>
                      )}

                      {item.error && (
                        <Box sx={{ alignSelf: "flex-start", maxWidth: "85%" }}>
                          <Notice severity="warning">{item.error}</Notice>
                        </Box>
                      )}
                    </Stack>
                  );
                  })}

                  <Box ref={endRef} sx={{ height: `${scrollPad}px`, scrollMarginBottom: `${scrollPad}px` }} />
                </Stack>
              </Box>
            )}
          </Box>

        </Stack>
      </PageLayout>

      <Box
        ref={inputBarRef}
        sx={(theme) => ({
          position: "fixed",
          left: 0,
          right: 0,
          bottom: inputBarBottom,
          zIndex: theme.zIndex.appBar,
          bgcolor: theme.palette.background.default,
          transition: "bottom 160ms ease-out",
        })}
      >
        <Container maxWidth="sm" disableGutters sx={{ px: 3 }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                inputRef={inputRef}
                label="Sua pergunta"
                placeholder="Ex: Qual e o prazo?"
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION_CHARS))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                size="small"
                fullWidth
                inputProps={{ maxLength: MAX_QUESTION_CHARS }}
              />
              <IconButton
                onClick={handleAsk}
                disabled={!canAsk}
                sx={{
                  height: 40,
                  width: 40,
                  borderRadius: "50%",
                  bgcolor: canAsk ? "primary.main" : "action.disabledBackground",
                  color: canAsk ? "primary.contrastText" : "text.disabled",
                  "&:hover": { bgcolor: canAsk ? "primary.dark" : "action.disabledBackground" },
                }}
              >
                <SendRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Este aplicativo e informativo e pode cometer erros. Consulte um profissional para orientacoes.
            </Typography>
          </Stack>
        </Container>
      </Box>

      {showJump && (
        <Fab
          size="small"
          aria-label="Ir para o fim"
          onClick={jumpToEnd}
          sx={(theme) => ({
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: jumpButtonBottom,
            zIndex: theme.zIndex.appBar + 2,
            width: 28,
            height: 28,
            minWidth: 28,
            minHeight: 28,
            padding: 0,
            borderRadius: "50%",
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
            boxShadow: "none",
            "&:hover": {
              bgcolor: theme.palette.background.paper,
              borderColor: alpha(theme.palette.text.primary, 0.18),
            },
          })}
        >
          <SvgIcon viewBox="0 0 24 24" sx={{ fontSize: 22, opacity: 0.9 }} fill="none">
            <path d="M12 3.5v10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <path
              d="M5.5 12.5L12 19l6.5-6.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </SvgIcon>
        </Fab>
      )}

      <Dialog open={docOpen} onClose={closeDocument} fullScreen>
        <PageLayout
          background="#000"
          contentPaddingTop={0}
          contentPaddingBottom={0}
          contentPaddingX={0}
          disableContainer
          contentSx={{ overflow: "hidden" }}
          header={
            <BackHeader
              onBack={closeDocument}
              headerSx={{ borderBottom: "none", bgcolor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
              iconButtonSx={{ color: "white" }}
              title={
                <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
                  Documento
                </Typography>
              }
            />
          }
        >
          <PinchZoomImage
            key={imageUrl ?? "empty"}
            src={imageUrl}
            alt={documentTitle}
            errorMessage={imageError || "Documento indisponivel."}
            minZoom={1}
            maxZoom={3}
          />
        </PageLayout>
      </Dialog>
    </>
  );
}

