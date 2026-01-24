"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearCaptureId } from "@/lib/captureIdStore";
import { loadCapture } from "@/lib/captureStore";
import { clearQaContext, loadQaContext } from "@/lib/qaContextStore";
import { clearResult, loadResult, AnalysisResult } from "@/lib/resultStore";
import { clearSessionToken, ensureSessionToken } from "@/lib/sessionToken";
import { telemetryCapture } from "@/lib/telemetry";
import { mapNetworkError, mapQaError } from "@/lib/errorMesages";
import { readQaStream } from "@/lib/qaStream";

import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import FooterActions from "../_components/FooterActions";
import PageHeader from "../_components/PageHeader";
import PageLayout from "../_components/PageLayout";
import Notice from "../_components/Notice";

type CardT = { id: string; title: string; text: string };
type QaItem = { id: string; question: string; answer?: string; error?: string; pending?: boolean };

const MAX_QUESTION_CHARS = 240;
const MIN_QUESTION_CHARS = 4;
const MAX_CONTEXT_CHARS = 3500;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const ACTION_BAR_HEIGHT = 88;
const INPUT_BAR_GAP = 8;
const SCROLL_PAD_FALLBACK = ACTION_BAR_HEIGHT + INPUT_BAR_GAP + 96;
const KEYBOARD_OPEN_THRESHOLD = 120;

function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export default function PerguntasPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputBarRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);
  const prevLoadingRef = useRef(false);
  const initialViewportRef = useRef<number | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [docOpen, setDocOpen] = useState(false);
  const [docZoom, setDocZoom] = useState(1);

  const [question, setQuestion] = useState("");
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<QaItem[]>([]);
  const [showJump, setShowJump] = useState(false);
  const [scrollPad, setScrollPad] = useState(SCROLL_PAD_FALLBACK);
  const [inputBarHeight, setInputBarHeight] = useState(0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

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
  const lastAnswer = useMemo(() => {
    for (let i = qaHistory.length - 1; i >= 0; i -= 1) {
      const answer = qaHistory[i]?.answer?.trim();
      if (answer) return answer;
    }
    return "";
  }, [qaHistory]);

  useEffect(() => {
    const res = loadResult();
    if (!res) {
      router.replace("/");
      return;
    }
    setResult(res);
  }, [router]);

  useEffect(() => {
    setTtsSupported(isSpeechSupported());
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (!result) return;
    telemetryCapture("qa_view", { contextSource: hasOcrContext ? "ocr" : "cards" });
  }, [result, hasOcrContext]);

  useEffect(() => {
    let objectUrl: string | null = null;

    (async () => {
      const payload = await loadCapture();
      if (!payload?.blob) {
        setImageError("Documento indisponivel para visualizacao.");
        return;
      }
      objectUrl = URL.createObjectURL(payload.blob);
      setImageUrl(objectUrl);
    })();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

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
  const canZoomIn = docZoom < MAX_ZOOM;
  const canZoomOut = docZoom > MIN_ZOOM;
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
      setShowJump(false);
    });
  }, [qaHistory]);

  useEffect(() => {
    if (prevLoadingRef.current && !qaLoading && qaHistory.length) {
      requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        setShowJump(false);
      });
    }
    prevLoadingRef.current = qaLoading;
  }, [qaLoading, qaHistory.length]);

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

  function updateJumpState() {
    const node = scrollRef.current;
    const target =
      node && node.scrollHeight > node.clientHeight
        ? node
        : typeof document !== "undefined"
        ? document.documentElement
        : null;
    if (!target) return;
    const threshold = 24;
    const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;
    autoScrollRef.current = atBottom;
    setShowJump(!atBottom);
  }

  useEffect(() => {
    if (isEmptyState) return;
    requestAnimationFrame(updateJumpState);
  }, [qaHistory.length, scrollPad, keyboardOffset, isEmptyState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleWindowScroll = () => updateJumpState();
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  function handleScroll() {
    updateJumpState();
  }

  function zoomIn() {
    setDocZoom((z) => Math.min(MAX_ZOOM, Number((z + ZOOM_STEP).toFixed(2))));
  }

  function zoomOut() {
    setDocZoom((z) => Math.max(MIN_ZOOM, Number((z - ZOOM_STEP).toFixed(2))));
  }

  function resetZoom() {
    setDocZoom(1);
  }

  function openDocument() {
    setDocZoom(1);
    setDocOpen(true);
  }

  function closeDocument() {
    setDocOpen(false);
  }

  function stopSpeaking() {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    setIsSpeaking(false);
  }

  function startSpeaking() {
    if (!ttsSupported || !lastAnswer) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(lastAnswer);
      utterance.lang = "pt-BR";
      utterance.rate = 0.95;
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  }

  function newDoc() {
    stopSpeaking();
    clearResult();
    clearQaContext();
    clearCaptureId();
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
      const token = await ensureSessionToken();
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-session-token": token } : {}) },
        body: JSON.stringify({ question: q, context: qaContext, attempt }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          await clearSessionToken();
        }
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

  function handleJumpToEnd() {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setShowJump(false);
  }

  if (!result) return null;

  return (
    <>
      <PageLayout
        contentPaddingBottom={isEmptyState ? 14 : 22}
        contentRef={scrollRef}
        onContentScroll={handleScroll}
        header={
          <PageHeader>
            <IconButton edge="start" onClick={() => router.push("/result")} sx={{ mr: 1 }}>
              <ArrowBackRoundedIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Tire suas duvidas
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              {ttsSupported && (
                <IconButton
                  onClick={isSpeaking ? stopSpeaking : startSpeaking}
                  color="primary"
                  disabled={!lastAnswer}
                  aria-label={isSpeaking ? "Parar leitura" : "Ouvir resposta"}
                >
                  {isSpeaking ? <StopCircleRoundedIcon /> : <VolumeUpRoundedIcon />}
                </IconButton>
              )}
              <IconButton onClick={openDocument} color="primary" disabled={!imageUrl} aria-label="Ver documento">
                <DescriptionRoundedIcon />
              </IconButton>
            </Stack>
          </PageHeader>
        }
        footer={
          <FooterActions
            actionBarSx={{
              bottom: actionBarOffset,
              transition: "bottom 160ms ease-out",
            }}
            primary={{
              label: "Analisar Outro",
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
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <Stack spacing={1.5}>
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

                <Stack spacing={1} alignItems="flex-start">
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
                        ? <ScheduleRoundedIcon fontSize="small" />
                        : q === "Qual e o valor?"
                        ? <PaidRoundedIcon fontSize="small" />
                        : q === "O que este documento pede?"
                        ? <DescriptionRoundedIcon fontSize="small" />
                        : <HelpOutlineRoundedIcon fontSize="small" />;
                    return (
                      <Chip
                        key={q}
                        icon={icon}
                        label={q}
                        size="medium"
                        variant="outlined"
                        sx={{
                          bgcolor: "background.paper",
                          borderColor: "divider",
                          fontSize: "0.85rem",
                          justifyContent: "flex-start",
                          borderRadius: 999,
                          px: 2,
                          py: 0.75,
                          height: "auto",
                          "& .MuiChip-label": { py: 0.25 },
                          "& .MuiChip-icon": { color: iconColor },
                        }}
                        onClick={() => handleQuickQuestion(q)}
                      />
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
                  {qaHistory.map((item) => (
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
                        <Box
                          sx={{
                            alignSelf: "flex-start",
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            maxWidth: "85%",
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {item.answer}
                          </Typography>
                        </Box>
                      )}

                      {item.error && (
                        <Box sx={{ alignSelf: "flex-start", maxWidth: "85%" }}>
                          <Notice severity="warning">{item.error}</Notice>
                        </Box>
                      )}
                    </Stack>
                  ))}

                  <Box ref={endRef} sx={{ height: `${scrollPad}px`, scrollMarginBottom: `${scrollPad}px` }} />
                </Stack>
              </Box>
            )}
          </Box>

        </Stack>
      </PageLayout>

      {!isEmptyState && (
        <Box
          ref={inputBarRef}
          sx={(theme) => ({
            position: "fixed",
            left: 0,
            right: 0,
            bottom: inputBarBottom,
            zIndex: theme.zIndex.appBar,
            px: 2,
            bgcolor: theme.palette.background.default,
            transition: "bottom 160ms ease-out",
          })}
        >
          <Box sx={{ maxWidth: 600, mx: "auto" }}>
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
          </Box>
        </Box>
      )}

      {showJump && (
        <Fab
          size="small"
          color="primary"
          aria-label="Ir para o fim"
          onClick={handleJumpToEnd}
          sx={(theme) => ({
            position: "fixed",
            right: 16,
            bottom: jumpButtonBottom,
            zIndex: theme.zIndex.appBar + 2,
            boxShadow: 3,
          })}
        >
          <KeyboardArrowDownRoundedIcon />
        </Fab>
      )}

      <Dialog open={docOpen} onClose={closeDocument} fullWidth maxWidth="sm">
        <DialogTitle>Documento</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Typography variant="caption" color="text.secondary">
              Toque no texto para ampliar
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {Math.round(docZoom * 100)}%
              </Typography>
              <IconButton onClick={zoomOut} disabled={!imageUrl || !canZoomOut}>
                <ZoomOutRoundedIcon />
              </IconButton>
              <IconButton onClick={zoomIn} disabled={!imageUrl || !canZoomIn}>
                <ZoomInRoundedIcon />
              </IconButton>
              <IconButton onClick={resetZoom} disabled={!imageUrl || docZoom === 1}>
                <RestartAltRoundedIcon />
              </IconButton>
            </Stack>
            <Box sx={{ bgcolor: "#000", borderRadius: 2, overflow: "auto", maxHeight: "60vh" }}>
              {imageUrl ? (
                <Box sx={{ width: `${docZoom * 100}%`, transformOrigin: "top center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={documentTitle} style={{ width: "100%", display: "block" }} />
                </Box>
              ) : (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {imageError || "Documento indisponivel."}
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
