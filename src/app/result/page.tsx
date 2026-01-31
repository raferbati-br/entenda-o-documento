"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadResult, AnalysisResult } from "@/lib/resultStore";
import { loadQaContext } from "@/lib/qaContextStore";
import { clearLatencyTrace, getLatencyTraceSnapshot } from "@/lib/latencyTrace";
import { telemetryCapture } from "@/lib/telemetry";
import { mapFeedbackError, mapNetworkError } from "@/lib/errorMesages";
import { postJsonWithSession } from "@/lib/apiClient";
import { resetAnalysisSession } from "@/lib/analysisSession";
import { useJumpToEnd } from "@/lib/hooks/useJumpToEnd";
import { useSpeechSynthesis } from "@/lib/hooks/useSpeechSynthesis";
import SectionBlock from "../_components/SectionBlock";

import {
  Box,
  Button,
  Chip,
  Divider,
  Fab,
  Stack,
  SvgIcon,
  Typography,
  Snackbar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import FooterActions from "../_components/FooterActions";
import BackHeader from "../_components/BackHeader";
import PageLayout from "../_components/PageLayout";
import Notice from "../_components/Notice";
import FeedbackActions from "../_components/FeedbackActions";

// === Tipos e Helpers ===
type CardT = { id: string; title: string; text: string };
const ACTION_BAR_HEIGHT = 88;
const JUMP_BUTTON_OFFSET = ACTION_BAR_HEIGHT + 12;
const SUMMARY_PAUSE_MS = 350;

function splitSummary(text: string) {
  const lines = text.split(/\n+/);
  const parts: string[] = [];
  for (const line of lines) {
    let current = "";
    for (const ch of line) {
      current += ch;
      if (ch === "." || ch === "!" || ch === "?") {
        const trimmed = current.trim();
        if (trimmed) parts.push(trimmed);
        current = "";
      }
    }
    const tail = current.trim();
    if (tail) parts.push(tail);
  }
  return parts;
}

function confidenceToInfo(confidence: number) {
  if (confidence < 0.45) return { label: "Baixa", color: "error.main", bg: "error.lighter", text: "Difícil de ler" };
  if (confidence < 0.75) return { label: "Média", color: "warning.main", bg: "warning.lighter", text: "Leitura parcial" };
  return { label: "Alta", color: "success.main", bg: "success.lighter", text: "Leitura clara" };
}

function getConfidenceBucket(confidence: number) {
  if (confidence < 0.45) return "low";
  if (confidence < 0.75) return "medium";
  return "high";
}

function renderTtsErrorNotice(ttsError: string | null) {
  if (!ttsError) return null;
  const severity = ttsError === "Leitura interrompida." ? "info" : "warning";
  return (
    <Notice severity={severity} sx={{ mb: 3 }}>
      {ttsError}
    </Notice>
  );
}

function renderLowConfidenceNotice(show: boolean, onRetry: () => void) {
  if (!show) return null;
  return (
    <Notice
      severity="warning"
      title="Foto difÃ­cil de ler"
      actions={
        <Button color="inherit" size="small" onClick={onRetry}>
          Refazer
        </Button>
      }
      sx={{ mb: 4 }}
    >
      O resultado pode ter erros.
    </Notice>
  );
}

function renderResultNotice(notice: string | null) {
  if (!notice) return null;
  return (
    <Box sx={{ mt: 3, mb: 0 }}>
      <Divider sx={{ my: 1 }} />
      <SectionBlock
        icon={<WarningRoundedIcon fontSize="inherit" />}
        title="ObservaÃ§Ã£o importante"
        text={notice}
        iconColor="warning.main"
      />
    </Box>
  );
}

function useFeedbackState(options: { confidenceBucket: string; hasOcrContext: boolean }) {
  const { confidenceBucket, hasOcrContext } = options;
  const [feedbackChoice, setFeedbackChoice] = useState<"up" | "down" | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  async function sendFeedback(helpful: boolean, reason?: string) {
    if (feedbackSent || feedbackLoading) return;
    setFeedbackLoading(true);
    setFeedbackError(null);

    try {
      const { res, data } = await postJsonWithSession<{ ok?: boolean; error?: string }>("/api/feedback", {
        helpful,
        reason,
        confidenceBucket,
        contextSource: hasOcrContext ? "ocr" : "cards",
      });
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
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

  function handleFeedbackReason(reason: string) {
    if (feedbackSent || feedbackLoading) return;
    setFeedbackReason(reason);
    sendFeedback(false, reason);
  }

  return {
    feedbackChoice,
    feedbackReason,
    feedbackSent,
    feedbackLoading,
    feedbackError,
    handleFeedbackUp,
    handleFeedbackDown,
    handleFeedbackReason,
  };
}

export default function ResultPage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [result] = useState<AnalysisResult | null>(() => loadResult());
  const { endRef, showJump, updateJumpState, handleScroll: handleContentScroll, jumpToEnd: handleJumpToEnd } =
    useJumpToEnd({ scrollRef });

  // TTS State
  const {
    supported: ttsSupported,
    isSpeaking,
    error: ttsError,
    setError: setTtsError,
    speak,
    speakSequence,
    stop,
  } = useSpeechSynthesis({
    lang: "pt-BR",
    rate: 0.95,
    unsupportedMessage: "Seu navegador nÃ£o suporta leitura em voz alta.",
    errorMessage: "Erro na leitura.",
    interruptedMessage: "Leitura interrompida.",
  });

  // Share State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [ttsMode, setTtsMode] = useState<"summary" | null>(null);

  useEffect(() => {
    if (!result) {
      router.replace("/");
    }
  }, [result, router]);

  useEffect(() => {
    if (ttsError !== "Leitura interrompida.") return;
    const timeoutId = globalThis.setTimeout(() => setTtsError(null), 3000);
    return () => globalThis.clearTimeout(timeoutId);
  }, [ttsError, setTtsError]);

  const activeTtsMode = isSpeaking ? ttsMode : null;

  useEffect(() => {
    if (!result) return;
    requestAnimationFrame(updateJumpState);
  }, [result, updateJumpState]);

  const cardsArr = useMemo<CardT[]>(() => (result?.cards as CardT[]) || [], [result]);
  const cardMap = useMemo(() => Object.fromEntries(cardsArr.map((c) => [c.id, c])), [cardsArr]);

  const confidence = result?.confidence ?? 0;
  const confInfo = useMemo(() => confidenceToInfo(confidence), [confidence]);
  const showLowConfidenceHelp = confidence < 0.45;

  const confidenceBucket = getConfidenceBucket(confidence);
  const hasOcrContext = useMemo(() => Boolean(loadQaContext()?.trim()), []);
  const {
    feedbackChoice,
    feedbackReason,
    feedbackSent,
    feedbackLoading,
    feedbackError,
    handleFeedbackUp,
    handleFeedbackDown,
    handleFeedbackReason,
  } = useFeedbackState({ confidenceBucket, hasOcrContext });

  useEffect(() => {
    if (!result) return;
    telemetryCapture("result_view", {
      confidenceBucket,
      contextSource: hasOcrContext ? "ocr" : "cards",
    });
  }, [result, confidenceBucket, hasOcrContext]);

  useEffect(() => {
    if (!result) return;
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
  }, [result]);

  // Texto completo para Leitura e Compartilhamento
  const fullText = useMemo(() => {
    const notice = result?.notice || "";
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
  }, [cardMap, result?.notice]);

  const summaryText = useMemo(() => cardMap["whatSays"]?.text?.trim() || "", [cardMap]);
  const summaryParts = useMemo(() => splitSummary(summaryText), [summaryText]);

  // Função de Compartilhar
  const handleShare = async () => {
    telemetryCapture("share_click");
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Explicação do Documento',
          text: fullText,
        });
      } catch {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback para PC
      try {
        await navigator.clipboard.writeText(fullText);
        setToastMsg("Texto copiado para a área de transferência!");
      } catch {
        setToastMsg("Não foi possível copiar o texto.");
      }
    }
  };

  async function copyResultText() {
    if (!speakText.trim()) return;
    try {
      await navigator.clipboard.writeText(speakText);
    } catch (err) {
      console.warn("[result] copy failed", err);
    }
  }

  // Funções de Áudio
  const speakText = fullText.replaceAll("*", "");
  const isSummarySpeaking = isSpeaking && activeTtsMode === "summary";

  function stopSpeaking() {
    stop();
    setTtsMode(null);
  }

  function startSpeaking() {
    stop({ withMessage: false });
    setTtsMode(null);
    speak(speakText);
  }

  function startSummarySpeaking() {
    if (!summaryParts.length) return;
    stop({ withMessage: false });
    setTtsMode("summary");
    speakSequence(summaryParts, SUMMARY_PAUSE_MS);
  }

  function newDoc() {
    stop({ withMessage: false });
    setTtsMode(null);
    resetAnalysisSession();
    router.push("/camera");
  }

  if (!result) return null;

  return (
    <>
      <PageLayout
        contentPaddingBottom={12}
        contentRef={scrollRef}
        onContentScroll={handleContentScroll}
        header={
          <BackHeader
            onBack={() => router.push("/")}
            title={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                  Explicação
                </Typography>
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
              </Box>
            }
          />
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
        {renderTtsErrorNotice(ttsError)}

        {renderLowConfidenceNotice(showLowConfidenceHelp, newDoc)}

          {/* Conteúdo Principal */}
        <Stack spacing={0} divider={<Divider sx={{ my: 1 }} />}>
          <SectionBlock
            icon={<DescriptionRoundedIcon fontSize="inherit" />}
            title={cardMap["whatIs"]?.title || "O que é"}
            text={cardMap["whatIs"]?.text}
            />
            <SectionBlock
              icon={<InfoRoundedIcon fontSize="inherit" />}
              title={cardMap["whatSays"]?.title || "O que diz"}
              text={cardMap["whatSays"]?.text}
              actions={
                ttsSupported ? (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={isSummarySpeaking ? <StopCircleRoundedIcon /> : <VolumeUpRoundedIcon />}
                    onClick={isSummarySpeaking ? stopSpeaking : startSummarySpeaking}
                    disabled={!summaryParts.length}
                    aria-label={isSummarySpeaking ? "Parar resumo em audio" : "Ouvir resumo em audio"}
                  >
                    {isSummarySpeaking ? "Parar resumo" : "Ouvir resumo"}
                  </Button>
                ) : null
              }
            />
            <SectionBlock
              icon={<EventRoundedIcon fontSize="inherit" />}
              title={cardMap["dates"]?.title || "Datas e prazos"}
              text={cardMap["dates"]?.text}
            />
            <SectionBlock
              icon={<ListAltRoundedIcon fontSize="inherit" />}
              // Remove emojis duplicados do título se a IA mandar
              title={cardMap["terms"]?.title?.replaceAll(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '') || "Termos importantes"}
              text={cardMap["terms"]?.text}
            />
            <SectionBlock
              icon={<HelpOutlineRoundedIcon fontSize="inherit" />}
              title={cardMap["whatUsuallyHappens"]?.title || "O que costuma acontecer"}
              text={cardMap["whatUsuallyHappens"]?.text}
            />
        </Stack>

          {/* --- AVISOS E RODAPÉ DO CONTEÚDO --- */}

          {/* 1. Aviso Dinâmico da IA (Só aparece se tiver observação importante) */}
        {renderResultNotice(result.notice)}

        <Box sx={{ mt: result.notice ? 0.5 : 3 }}>
          <Stack spacing={1}>
            <FeedbackActions
              canCopy={Boolean(speakText.trim())}
              canSpeak={ttsSupported && Boolean(speakText.trim())}
              isSpeaking={isSpeaking}
              onToggleSpeak={isSpeaking ? stopSpeaking : startSpeaking}
              onCopy={copyResultText}
              onShare={handleShare}
              feedbackChoice={feedbackChoice}
              feedbackValue={feedbackSent ? feedbackChoice : null}
              feedbackReason={feedbackReason}
              feedbackSent={feedbackSent}
              feedbackLoading={feedbackLoading}
              feedbackError={feedbackError}
              onFeedbackUp={handleFeedbackUp}
              onFeedbackDown={handleFeedbackDown}
              onFeedbackReason={handleFeedbackReason}
            />
            <Divider />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Este aplicativo e informativo e pode cometer erros. Consulte um profissional para orientacoes.
            </Typography>
          </Stack>
        </Box>


        <Box ref={endRef} sx={{ height: 8 }} />
      </PageLayout>

      {showJump && (
        <Fab
          size="small"
          aria-label="Ir para o fim"
          onClick={handleJumpToEnd}
          sx={(theme) => ({
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: JUMP_BUTTON_OFFSET,
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

