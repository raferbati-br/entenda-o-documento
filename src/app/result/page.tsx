"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearCaptureId, loadCaptureId } from "@/lib/captureIdStore";
import { loadCapture } from "@/lib/captureStore";
import { clearResult, loadResult, saveResult, AnalysisResult } from "@/lib/resultStore";
import { clearQaContext, loadQaContext, saveQaContext } from "@/lib/qaContextStore";
import { clearSessionToken, ensureSessionToken } from "@/lib/sessionToken";
import { clearLatencyTrace, getLatencyTraceSnapshot, markLatencyTrace, recordLatencyStep } from "@/lib/latencyTrace";
import { telemetryCapture } from "@/lib/telemetry";
import { buildAnalyzeFriendlyError, mapFeedbackError, mapNetworkError, type FriendlyError } from "@/lib/errorMesages";
import { readAnalyzeStream } from "@/lib/analyzeStream";
import SectionBlock from "../_components/SectionBlock";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  Snackbar,
  CircularProgress,
} from "@mui/material";

import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import ThumbDownAltRoundedIcon from "@mui/icons-material/ThumbDownAltRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import Disclaimer from "../_components/Disclaimer";
import FooterActions from "../_components/FooterActions";
import PageHeader from "../_components/PageHeader";
import PageLayout from "../_components/PageLayout";
import Notice from "../_components/Notice";

// === Tipos e Helpers ===
type CardT = { id: string; title: string; text: string };
const ACTION_BAR_HEIGHT = 88;
const JUMP_BUTTON_OFFSET = ACTION_BAR_HEIGHT + 12;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

function confidenceToInfo(confidence: number) {
  if (confidence < 0.45) return { label: "Baixa", color: "error.main", bg: "error.lighter", text: "Difícil de ler" };
  if (confidence < 0.75) return { label: "Média", color: "warning.main", bg: "warning.lighter", text: "Leitura parcial" };
  return { label: "Alta", color: "success.main", bg: "success.lighter", text: "Leitura clara" };
}

function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function buildEmptyResult(): AnalysisResult {
  return {
    confidence: 0,
    notice: "",
    cards: [
      { id: "whatIs", title: "O que Ã© este documento", text: "" },
      { id: "whatSays", title: "O que este documento estÃ¡ comunicando", text: "" },
      { id: "dates", title: "Datas ou prazos importantes", text: "" },
      { id: "terms", title: "ðŸ“˜ Palavras difÃ­ceis explicadas", text: "" },
      { id: "whatUsuallyHappens", title: "O que normalmente acontece", text: "" },
    ],
  };
}


export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const streamStartedRef = useRef(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<FriendlyError | null>(null);
  const [showJump, setShowJump] = useState(false);

  // TTS State
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const stopRequestedRef = useRef(false);

  // Share State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Document State
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [docOpen, setDocOpen] = useState(false);
  const [docZoom, setDocZoom] = useState(1);

  // Feedback State
  const [feedbackChoice, setFeedbackChoice] = useState<"up" | "down" | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const feedbackReasons = useMemo(
    () => [
      "Incompleta",
      "Confusa",
      "Errada",
      "Outro",
    ],
    []
  );

  const streamRequested = searchParams.get("stream") === "1";

  function mergeCardUpdate(card: Partial<CardT> & { id: string }) {
    setResult((prev) => {
      const base = prev ?? buildEmptyResult();
      const cards = base.cards.map((item) =>
        item.id === card.id
          ? {
              ...item,
              title: card.title || item.title,
              text: typeof card.text === "string" ? card.text : item.text,
            }
          : item
      );
      return { ...base, cards };
    });
  }

  async function runAnalyzeStream() {
    if (streamStartedRef.current) return;
    streamStartedRef.current = true;

    const captureId = loadCaptureId();
    if (!captureId) {
      router.replace("/");
      return;
    }

    const attemptKey = `analyze_attempt:${captureId}`;
    const attempt = Number(sessionStorage.getItem(attemptKey) || "0") + 1;
    sessionStorage.setItem(attemptKey, String(attempt));

    setAnalysisError(null);
    setIsStreaming(true);
    setAnalysisDone(false);
    setResult(buildEmptyResult());

    let ocrText = (loadQaContext() || "").trim();
    const token = await ensureSessionToken();

    if (!ocrText) {
      const ocrStart = performance.now();
      const ocrRes = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-session-token": token } : {}) },
        body: JSON.stringify({ captureId, attempt }),
      });

      const ocrData = await ocrRes.json().catch(() => ({}));
      const ocrDurationMs = performance.now() - ocrStart;
      recordLatencyStep("ocr_ms", ocrDurationMs);
      telemetryCapture("openai_ocr_latency", {
        ms: Math.round(ocrDurationMs),
        attempt,
        status: ocrRes.status,
      });
      if (ocrRes.ok && ocrData?.ok && typeof ocrData?.documentText === "string" && ocrData.documentText.trim()) {
        ocrText = ocrData.documentText.trim();
        saveQaContext(ocrText);
        setHasOcrContext(true);
      }
    }

    const analyzeStart = performance.now();
    telemetryCapture("analyze_start");
    const analyzePayload = { captureId, attempt, ...(ocrText ? { ocrText } : {}) };
    const res = await fetch("/api/analyze/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { "x-session-token": token } : {}) },
      body: JSON.stringify(analyzePayload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await clearSessionToken();
      }
      telemetryCapture("analyze_error", {
        status: res.status,
        error: typeof data?.error === "string" ? data.error : "unknown",
      });
      setAnalysisError(buildAnalyzeFriendlyError(res, data));
      setIsStreaming(false);
      return;
    }

    if (!res.body) {
      setAnalysisError({
        title: "Erro ao analisar",
        message: "Resposta vazia do servidor.",
      });
      setIsStreaming(false);
      return;
    }

    try {
      for await (const event of readAnalyzeStream(res.body)) {
        if (event.type === "card") {
          mergeCardUpdate(event.card);
        }
        if (event.type === "result") {
          setResult(event.result);
          saveResult(event.result);
          setIsStreaming(false);
          setAnalysisDone(true);
          recordLatencyStep("analyze_ms", performance.now() - analyzeStart);
          telemetryCapture("openai_cards_latency", {
            ms: Math.round(performance.now() - analyzeStart),
            attempt,
            status: 200,
          });
          telemetryCapture("analyze_success");
          markLatencyTrace("analyze_done");
          break;
        }
        if (event.type === "error") {
          telemetryCapture("analyze_error", { status: 502, error: event.message });
          setAnalysisError({
            title: "Erro ao analisar",
            message: event.message || "Nao foi possivel analisar o documento.",
          });
          setIsStreaming(false);
          setAnalysisDone(false);
          break;
        }
      }
    } catch (err: any) {
      const message = typeof err?.message === "string" ? err.message : "";
      setAnalysisError({
        title: "Erro ao analisar",
        message: mapNetworkError(message),
      });
      setIsStreaming(false);
      setAnalysisDone(false);
    }
  }

  useEffect(() => {
    const res = loadResult();
    if (res && !streamRequested) {
      setAnalysisError(null);
      setIsStreaming(false);
      setResult(res);
      setAnalysisDone(true);
      return;
    }
    runAnalyzeStream();
  }, [router, streamRequested]);

  useEffect(() => {
    setTtsSupported(isSpeechSupported());
    return () => {
      try { window.speechSynthesis.cancel(); } catch { }
    };
  }, []);

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

  useEffect(() => {
    if (ttsError !== "Leitura interrompida.") return;
    const timeoutId = window.setTimeout(() => setTtsError(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [ttsError]);

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
    setShowJump(!atBottom);
  }

  function handleContentScroll() {
    updateJumpState();
  }

  function handleJumpToEnd() {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  useEffect(() => {
    if (!result) return;
    requestAnimationFrame(updateJumpState);
  }, [result]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleWindowScroll = () => updateJumpState();
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  const safeResult = useMemo(() => result ?? buildEmptyResult(), [result]);
  const cardsArr = useMemo<CardT[]>(() => (safeResult.cards as CardT[]) || buildEmptyResult().cards, [safeResult]);
  const cardMap = useMemo(() => Object.fromEntries(cardsArr.map((c) => [c.id, c])), [cardsArr]);

  const confidence = safeResult.confidence ?? 0;
  const confInfo = useMemo(() => confidenceToInfo(confidence), [confidence]);
  const showLowConfidenceHelp = analysisDone && confidence < 0.45;
  const canShare = analysisDone;
  const canSpeak = ttsSupported && analysisDone;
  const showSkeleton = isStreaming && !analysisDone;
  const loadingBody = (
    <Stack spacing={1}>
      <Skeleton variant="text" width="92%" />
      <Skeleton variant="text" width="84%" />
      <Skeleton variant="text" width="70%" />
    </Stack>
  );

  const confidenceBucket = confidence < 0.45 ? "low" : confidence < 0.75 ? "medium" : "high";
  const [hasOcrContext, setHasOcrContext] = useState(() => Boolean(loadQaContext()?.trim()));

  useEffect(() => {
    if (!result || !analysisDone) return;
    telemetryCapture("result_view", {
      confidenceBucket,
      contextSource: hasOcrContext ? "ocr" : "cards",
    });
  }, [result, analysisDone, confidenceBucket, hasOcrContext]);

  useEffect(() => {
    if (!result || !analysisDone) return;
    const nowMs = Date.now();
    const trace = getLatencyTraceSnapshot(nowMs);
    if (!trace) return;
    const payload: Record<string, number> = {
      total_ms: trace.totalMs,
      ...trace.steps,
    };
    const analyzeDoneMs = trace.marks.analyze_done;
    if (Number.isFinite(analyzeDoneMs)) {
      payload.result_render_ms = Math.max(0, Math.round(nowMs - analyzeDoneMs));
    }
    telemetryCapture("latency_e2e", payload);
    clearLatencyTrace();
  }, [result, analysisDone]);

  // Texto completo para Leitura e Compartilhamento
  const fullText = useMemo(() => {
    const notice = safeResult.notice || "";
    const parts = [
      "📋 *Explicação do Documento*",
      "",
      cardMap["whatIs"]?.title ? `*${cardMap["whatIs"]?.title}*\n${cardMap["whatIs"]?.text}` : "",
      cardMap["whatSays"]?.title ? `*${cardMap["whatSays"]?.title}*\n${cardMap["whatSays"]?.text}` : "",
      cardMap["dates"]?.title ? `*${cardMap["dates"]?.title}*\n${cardMap["dates"]?.text}` : "",
      cardMap["terms"]?.title ? `*${cardMap["terms"]?.title}*\n${cardMap["terms"]?.text}` : "",
      cardMap["whatUsuallyHappens"]?.title ? `*${cardMap["whatUsuallyHappens"]?.title}*\n${cardMap["whatUsuallyHappens"]?.text}` : "",
      notice ? `⚠️ *Aviso*\n${notice}` : "",
      "",
      "Gerado por Entenda o Documento"
    ].filter(Boolean).join("\n\n");
    return parts;
  }, [cardMap, safeResult.notice]);

  async function sendFeedback(helpful: boolean, reason?: string) {
    if (feedbackSent || feedbackLoading) return;
    setFeedbackLoading(true);
    setFeedbackError(null);

    try {
      const token = await ensureSessionToken();
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-session-token": token } : {}) },
        body: JSON.stringify({
          helpful,
          reason,
          confidenceBucket,
          contextSource: hasOcrContext ? "ocr" : "cards",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await clearSessionToken();
      }
      if (!res.ok || !data?.ok) {
        const apiError = typeof data?.error === "string" ? data.error : "";
        throw new Error(mapFeedbackError(res.status, apiError));
      }

      setFeedbackSent(true);
      telemetryCapture(helpful ? "feedback_yes" : "feedback_no", {
        reason: reason || "",
        confidenceBucket,
        contextSource: hasOcrContext ? "ocr" : "cards",
      });
      setToastMsg("Obrigado pelo feedback!");
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "";
      setFeedbackError(mapNetworkError(msg));
    } finally {
      setFeedbackLoading(false);
    }
  }

  function handleFeedbackUp() {
    if (feedbackSent) return;
    setFeedbackChoice("up");
    setFeedbackReason(null);
    sendFeedback(true);
  }

  function handleFeedbackDown() {
    if (feedbackSent) return;
    setFeedbackChoice("down");
    setFeedbackReason(null);
    setFeedbackError(null);
  }

  // Função de Compartilhar
  const handleShare = async () => {
    telemetryCapture("share_click");
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Explicação do Documento',
          text: fullText,
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback para PC
      try {
        await navigator.clipboard.writeText(fullText);
        setToastMsg("Texto copiado para a área de transferência!");
      } catch (err) {
        setToastMsg("Não foi possível copiar o texto.");
      }
    }
  };

  // Funções de Áudio
  const speakText = useMemo(() => fullText.replace(/\*/g, ""), [fullText]);
  const canZoomIn = docZoom < MAX_ZOOM;
  const canZoomOut = docZoom > MIN_ZOOM;

  function stopSpeaking() {
    stopRequestedRef.current = true;
    setTtsError("Leitura interrompida.");
    try { window.speechSynthesis.cancel(); } catch { }
    setIsSpeaking(false);
  }

  function startSpeaking() {
    stopRequestedRef.current = false;
    setTtsError(null);
    if (!ttsSupported) {
      setTtsError("Seu navegador não suporta leitura em voz alta.");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(speakText);
      u.lang = "pt-BR";
      u.rate = 0.95;
      u.onstart = () => {
        setIsSpeaking(true);
        setTtsError(null);
      };
      u.onend = () => {
        setIsSpeaking(false);
        stopRequestedRef.current = false;
      };
      u.onerror = () => {
        setIsSpeaking(false);
        if (stopRequestedRef.current) {
          setTtsError("Leitura interrompida.");
          stopRequestedRef.current = false;
          return;
        }
        setTtsError("Erro na leitura.");
      };
      window.speechSynthesis.speak(u);
    } catch {
      setIsSpeaking(false);
      setTtsError("Erro ao iniciar áudio.");
    }
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

  function newDoc() {
    stopSpeaking();
    clearResult();
    clearQaContext();
    clearCaptureId();
    router.push("/camera");
  }

  return (
    <>
      <PageLayout
        contentPaddingBottom={20}
        contentRef={scrollRef}
        onContentScroll={handleContentScroll}
        header={
          <PageHeader>
            <IconButton edge="start" onClick={() => router.push("/")} sx={{ mr: 1 }}>
              <ArrowBackRoundedIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                Explicação
              </Typography>
              {analysisDone && (
                <Chip
                  label={confInfo.text}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    bgcolor: confInfo.bg || "action.hover",
                    color: confInfo.color || "text.primary",
                  }}
                />
              )}
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              {ttsSupported && (
                <IconButton
                  onClick={isSpeaking ? stopSpeaking : startSpeaking}
                  color="primary"
                  disabled={!canSpeak}
                >
                  {isSpeaking ? <StopCircleRoundedIcon /> : <VolumeUpRoundedIcon />}
                </IconButton>
              )}
              <IconButton onClick={openDocument} color="primary" disabled={!imageUrl}>
                <DescriptionRoundedIcon />
              </IconButton>
              <IconButton onClick={handleShare} color="primary" disabled={!canShare}>
                <IosShareRoundedIcon />
              </IconButton>
            </Stack>
</PageHeader>
        }
        footer={
          <FooterActions
            secondary={{
              label: "Tirar duvidas",
              startIcon: <HelpOutlineRoundedIcon />,
              onClick: () => {
                telemetryCapture("qa_open");
                router.push("/perguntas");
              },
            }}
            primary={{
              label: "Analisar Outro",
              startIcon: <CameraAltRoundedIcon />,
              onClick: newDoc,
            }}
          />
        }
      >
        {analysisError && (
          <Notice
            severity="error"
            title={analysisError.title}
            actions={
              analysisError.actionLabel ? (
                <Button color="inherit" size="small" onClick={() => router.push(analysisError.actionHref || "/")}>
                  {analysisError.actionLabel}
                </Button>
              ) : null
            }
            sx={{ mb: 3 }}
          >
            {analysisError.message}
          </Notice>
        )}

        {ttsError && (
          <Notice severity={ttsError === "Leitura interrompida." ? "info" : "warning"} sx={{ mb: 3 }}>
            {ttsError}
          </Notice>
        )}

        {showLowConfidenceHelp && (
          <Notice
            severity="warning"
            title="Foto difícil de ler"
            actions={
              <Button color="inherit" size="small" onClick={newDoc}>
                Refazer
              </Button>
            }
            sx={{ mb: 4 }}
          >
            O resultado pode ter erros.
          </Notice>
        )}

          {/* Conteúdo Principal */}
        <Stack spacing={0} divider={<Divider sx={{ my: 1 }} />}>
          <SectionBlock
            icon={<DescriptionRoundedIcon fontSize="inherit" />}
            title={cardMap["whatIs"]?.title || "O que é"}
            text={cardMap["whatIs"]?.text}
          >
            {showSkeleton && !cardMap["whatIs"]?.text ? loadingBody : null}
          </SectionBlock>
            <SectionBlock
              icon={<InfoRoundedIcon fontSize="inherit" />}
              title={cardMap["whatSays"]?.title || "O que diz"}
              text={cardMap["whatSays"]?.text}
            >
              {showSkeleton && !cardMap["whatSays"]?.text ? loadingBody : null}
            </SectionBlock>
            <SectionBlock
              icon={<EventRoundedIcon fontSize="inherit" />}
              title={cardMap["dates"]?.title || "Datas e prazos"}
              text={cardMap["dates"]?.text}
            >
              {showSkeleton && !cardMap["dates"]?.text ? loadingBody : null}
            </SectionBlock>
            <SectionBlock
              icon={<ListAltRoundedIcon fontSize="inherit" />}
              // Remove emojis duplicados do título se a IA mandar
              title={cardMap["terms"]?.title?.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '') || "Termos importantes"}
              text={cardMap["terms"]?.text}
            >
              {showSkeleton && !cardMap["terms"]?.text ? loadingBody : null}
            </SectionBlock>
            <SectionBlock
              icon={<HelpOutlineRoundedIcon fontSize="inherit" />}
              title={cardMap["whatUsuallyHappens"]?.title || "O que costuma acontecer"}
              text={cardMap["whatUsuallyHappens"]?.text}
            >
              {showSkeleton && !cardMap["whatUsuallyHappens"]?.text ? loadingBody : null}
            </SectionBlock>
        </Stack>

          {/* --- AVISOS E RODAPÉ DO CONTEÚDO --- */}

          {/* 1. Aviso Dinâmico da IA (Só aparece se tiver observação importante) */}
        {safeResult.notice && (
          <Box sx={{ mt: 3, mb: 1.5 }}>
            <Divider sx={{ my: 1 }} />
            <SectionBlock
              icon={<WarningRoundedIcon fontSize="inherit" />}
              title="Observação importante"
              text={safeResult.notice}
              iconColor="warning.main"
            />
          </Box>
        )}

                {/* 2. Aviso Legal Padrão (Igual Home) */}
        <Disclaimer variant="beforeFooter" withNotice={Boolean(safeResult.notice)} />

        <Box sx={{ mt: safeResult.notice ? 2 : 3, mb: 1.5 }}>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Esta explicação foi útil?
              </Typography>
              <Button
                variant={feedbackChoice === "up" ? "contained" : "text"}
                onClick={handleFeedbackUp}
                disabled={feedbackLoading || feedbackSent}
                size="small"
                aria-label="Feedback positivo"
                sx={{ minWidth: 0, px: 1 }}
              >
                <ThumbUpAltRoundedIcon fontSize="small" />
              </Button>
              <Button
                variant={feedbackChoice === "down" ? "contained" : "text"}
                onClick={handleFeedbackDown}
                disabled={feedbackLoading || feedbackSent}
                size="small"
                aria-label="Feedback negativo"
                sx={{ minWidth: 0, px: 1 }}
              >
                <ThumbDownAltRoundedIcon fontSize="small" />
              </Button>
              {feedbackLoading && <CircularProgress size={16} />}
            </Stack>
  {feedbackChoice === "down" && !feedbackSent && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                {feedbackReasons.map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    size="small"
                    variant={feedbackReason === r ? "filled" : "outlined"}
                    onClick={() => {
                      if (feedbackSent || feedbackLoading) return;
                      setFeedbackReason(r);
                      sendFeedback(false, r);
                    }}
                    disabled={feedbackLoading}
                  />
                ))}
              </Box>
            )}
            {feedbackSent && (
              <Typography variant="caption" color="text.secondary">
                Obrigado pelo feedback.
              </Typography>
            )}
            {feedbackError && <Notice severity="warning">{feedbackError}</Notice>}
          </Stack>
        </Box>


        <Box ref={endRef} sx={{ height: 20 }} />
      </PageLayout>

      {showJump && (
        <Fab
          size="small"
          color="primary"
          aria-label="Ir para o fim"
          onClick={handleJumpToEnd}
          sx={(theme) => ({
            position: "fixed",
            right: 16,
            bottom: JUMP_BUTTON_OFFSET,
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
                  <img src={imageUrl} alt="Documento" style={{ width: "100%", display: "block" }} />
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

      <Snackbar
        open={!!toastMsg}
        autoHideDuration={3000}
        onClose={() => setToastMsg(null)}
        message={toastMsg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: 90, sm: 24 } }}
      />
    </>
  );
}
