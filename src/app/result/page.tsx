"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearCaptureId } from "@/lib/captureIdStore";
import { clearResult, loadResult, AnalysisResult } from "@/lib/resultStore";
import { clearQaContext, loadQaContext } from "@/lib/qaContextStore";
import { clearSessionToken, ensureSessionToken } from "@/lib/sessionToken";
import { clearLatencyTrace, getLatencyTraceSnapshot } from "@/lib/latencyTrace";
import { telemetryCapture } from "@/lib/telemetry";
import { mapFeedbackError, mapNetworkError } from "@/lib/errorMesages";
import SectionBlock from "../_components/SectionBlock";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
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
import Disclaimer from "../_components/Disclaimer";
import FooterActions from "../_components/FooterActions";
import PageHeader from "../_components/PageHeader";
import PageLayout from "../_components/PageLayout";
import Notice from "../_components/Notice";

// === Tipos e Helpers ===
type CardT = { id: string; title: string; text: string };

function confidenceToInfo(confidence: number) {
  if (confidence < 0.45) return { label: "Baixa", color: "error.main", bg: "error.lighter", text: "Difícil de ler" };
  if (confidence < 0.75) return { label: "Média", color: "warning.main", bg: "warning.lighter", text: "Leitura parcial" };
  return { label: "Alta", color: "success.main", bg: "success.lighter", text: "Leitura clara" };
}

function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}


export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // TTS State
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const stopRequestedRef = useRef(false);

  // Share State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
      try { window.speechSynthesis.cancel(); } catch { }
    };
  }, []);

  useEffect(() => {
    if (ttsError !== "Leitura interrompida.") return;
    const timeoutId = window.setTimeout(() => setTtsError(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [ttsError]);

  const cardsArr = useMemo<CardT[]>(() => (result?.cards as CardT[]) || [], [result]);
  const cardMap = useMemo(() => Object.fromEntries(cardsArr.map((c) => [c.id, c])), [cardsArr]);

  const confidence = result?.confidence ?? 0;
  const confInfo = useMemo(() => confidenceToInfo(confidence), [confidence]);
  const showLowConfidenceHelp = confidence < 0.45;

  const confidenceBucket = confidence < 0.45 ? "low" : confidence < 0.75 ? "medium" : "high";
  const hasOcrContext = useMemo(() => Boolean(loadQaContext()?.trim()), []);

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

  function newDoc() {
    stopSpeaking();
    clearResult();
    clearQaContext();
    clearCaptureId();
    router.push("/camera");
  }

  if (!result) return null;

  return (
    <>
      <PageLayout
        contentPaddingBottom={20}
        header={
          <PageHeader>
            <IconButton edge="start" onClick={() => router.push("/")} sx={{ mr: 1 }}>
              <ArrowBackRoundedIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1 }}>
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

            <Stack direction="row" spacing={1} alignItems="center">
              {ttsSupported && (
                <IconButton onClick={isSpeaking ? stopSpeaking : startSpeaking} color="primary">
                  {isSpeaking ? <StopCircleRoundedIcon /> : <VolumeUpRoundedIcon />}
                </IconButton>
              )}
              <IconButton onClick={handleShare} color="primary">
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
            />
            <SectionBlock
              icon={<InfoRoundedIcon fontSize="inherit" />}
              title={cardMap["whatSays"]?.title || "O que diz"}
              text={cardMap["whatSays"]?.text}
            />
            <SectionBlock
              icon={<EventRoundedIcon fontSize="inherit" />}
              title={cardMap["dates"]?.title || "Datas e prazos"}
              text={cardMap["dates"]?.text}
            />
            <SectionBlock
              icon={<ListAltRoundedIcon fontSize="inherit" />}
              // Remove emojis duplicados do título se a IA mandar
              title={cardMap["terms"]?.title?.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '') || "Termos importantes"}
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
        {result.notice && (
          <Box sx={{ mt: 3, mb: 1.5 }}>
            <Divider sx={{ my: 1 }} />
            <SectionBlock
              icon={<WarningRoundedIcon fontSize="inherit" />}
              title="Observação importante"
              text={result.notice}
              iconColor="warning.main"
            />
          </Box>
        )}

                {/* 2. Aviso Legal Padrão (Igual Home) */}
        <Disclaimer variant="beforeFooter" withNotice={Boolean(result.notice)} />

        <Box sx={{ mt: result.notice ? 2 : 3, mb: 1.5 }}>
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


        <Box sx={{ height: 20 }} />
      </PageLayout>

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
