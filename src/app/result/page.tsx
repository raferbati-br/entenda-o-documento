"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearCaptureId } from "@/lib/captureIdStore";
import { clearResult, loadResult, AnalysisResult } from "@/lib/resultStore";
import { clearQaContext, loadQaContext } from "@/lib/qaContextStore";
import { ensureSessionToken } from "@/lib/sessionToken";
import { telemetryCapture } from "@/lib/telemetry";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  TextField,
  Stack,
  Typography,
  AppBar,
  Toolbar,
  Paper,
  Snackbar,
  CircularProgress,
} from "@mui/material";

import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import ThumbDownAltRoundedIcon from "@mui/icons-material/ThumbDownAltRounded";

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

// Componente de Seção Limpo
function SectionBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text?: string }) {
  if (!text) return null;
  return (
    <Box sx={{ py: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ color: "primary.main" }}>{icon}</Box>
        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
          {title}
        </Typography>
      </Stack>
      <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", color: "text.primary", lineHeight: 1.6 }}>
        {text}
      </Typography>
    </Box>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // TTS State
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  // Share State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Q&A State
  const [question, setQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [qaError, setQaError] = useState<string | null>(null);
  const [qaLoading, setQaLoading] = useState(false);

  // Feedback State
  const [feedbackChoice, setFeedbackChoice] = useState<"up" | "down" | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const commonQuestions = useMemo(
    () => [
      "Qual e o prazo?",
      "Qual e o valor?",
      "O que este documento pede?",
      "Quem enviou o documento?",
      "Ha multa ou juros?",
    ],
    []
  );

  const feedbackReasons = useMemo(
    () => [
      "Informacao incompleta",
      "Resposta confusa",
      "Resposta errada",
      "Lingua complicada",
      "Outro motivo",
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

  const cardsArr = useMemo<CardT[]>(() => (result?.cards as CardT[]) || [], [result]);
  const cardMap = useMemo(() => Object.fromEntries(cardsArr.map((c) => [c.id, c])), [cardsArr]);

  const confidence = result?.confidence ?? 0;
  const confInfo = useMemo(() => confidenceToInfo(confidence), [confidence]);
  const showLowConfidenceHelp = confidence < 0.45;

  const MAX_QUESTION_CHARS = 240;
  const MIN_QUESTION_CHARS = 4;
  const MAX_CONTEXT_CHARS = 3500;
  const confidenceBucket = confidence < 0.45 ? "low" : confidence < 0.75 ? "medium" : "high";
  const hasOcrContext = useMemo(() => Boolean(loadQaContext()?.trim()), []);

  useEffect(() => {
    if (!result) return;
    telemetryCapture("result_view", {
      confidenceBucket,
      contextSource: hasOcrContext ? "ocr" : "cards",
    });
  }, [result, confidenceBucket, hasOcrContext]);

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

  const canAsk = question.trim().length >= MIN_QUESTION_CHARS && !qaLoading;

  async function handleAsk() {
    const q = question.trim();
    if (!q || q.length < MIN_QUESTION_CHARS || q.length > MAX_QUESTION_CHARS) return;
    if (!qaContext) {
      setQaError("Nao foi possivel montar o contexto do documento.");
      return;
    }

    setQaLoading(true);
    setQaError(null);
    setQaAnswer(null);
    telemetryCapture("qa_question_submit", {
      contextSource: hasOcrContext ? "ocr" : "cards",
      length: q.length,
    });

    try {
      const token = await ensureSessionToken();
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-session-token": token } : {}) },
        body: JSON.stringify({ question: q, context: qaContext }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Falha ao responder.");
      }

      setQaAnswer(typeof data?.answer === "string" ? data.answer : "");
      telemetryCapture("qa_answer_success");
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "Nao foi possivel responder agora.";
      setQaError(msg);
      telemetryCapture("qa_answer_error");
    } finally {
      setQaLoading(false);
    }
  }

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
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Falha ao enviar feedback.");
      }

      setFeedbackSent(true);
      telemetryCapture(helpful ? "feedback_yes" : "feedback_no", {
        reason: reason || "",
        confidenceBucket,
        contextSource: hasOcrContext ? "ocr" : "cards",
      });
      setToastMsg("Obrigado pelo feedback!");
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "Nao foi possivel enviar feedback.";
      setFeedbackError(msg);
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
    setTtsError(null);
    try { window.speechSynthesis.cancel(); } catch { }
    setIsSpeaking(false);
  }

  function startSpeaking() {
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
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => {
        setIsSpeaking(false);
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
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", bgcolor: "background.paper" }}>

      {/* 1. Navbar Sticky */}
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/')} sx={{ mr: 1 }}>
            <ArrowBackRoundedIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              Explicação
            </Typography>
            <Chip
              label={confInfo.text}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: confInfo.bg || 'action.hover',
                color: confInfo.color || 'text.primary'
              }}
            />
          </Box>

          <IconButton onClick={handleShare} color="primary">
            <IosShareRoundedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 2. Conteúdo Scrollavel */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", pb: 20 }}>
        <Container maxWidth="sm" sx={{ pt: 3, px: 3 }}>

          {/* Player de Áudio */}
          {ttsSupported && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 4,
                bgcolor: isSpeaking ? 'primary.main' : 'background.default',
                color: isSpeaking ? 'white' : 'text.primary',
                borderColor: isSpeaking ? 'primary.main' : 'divider',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.3s ease'
              }}
            >
              <IconButton
                onClick={isSpeaking ? stopSpeaking : startSpeaking}
                sx={{
                  bgcolor: isSpeaking ? 'white' : 'primary.main',
                  color: isSpeaking ? 'primary.main' : 'white',
                  '&:hover': { bgcolor: isSpeaking ? '#f0f0f0' : 'primary.dark' }
                }}
              >
                {isSpeaking ? <StopCircleRoundedIcon /> : <VolumeUpRoundedIcon />}
              </IconButton>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  {isSpeaking ? "Lendo agora..." : "Ouvir explicação"}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {isSpeaking ? "Toque para pausar" : "Ouvir o conteúdo em áudio"}
                </Typography>
              </Box>
            </Paper>
          )}

          {ttsError && (
            <Alert severity="warning" sx={{ mb: 3 }}>{ttsError}</Alert>
          )}

          {showLowConfidenceHelp && (
            <Alert
              severity="warning"
              icon={<WarningRoundedIcon />}
              sx={{ mb: 4, borderRadius: 3 }}
              action={
                <Button color="inherit" size="small" onClick={newDoc}>
                  Refazer
                </Button>
              }
            >
              <Typography variant="subtitle2" fontWeight={700}>Foto difícil de ler</Typography>
              <Typography variant="body2">O resultado pode ter erros.</Typography>
            </Alert>
          )}

          {/* Conteúdo Principal */}
          <Stack spacing={0} divider={<Divider sx={{ my: 1 }} />}>
            <SectionBlock
              icon={<DescriptionRoundedIcon />}
              title={cardMap["whatIs"]?.title || "O que é"}
              text={cardMap["whatIs"]?.text}
            />
            <SectionBlock
              icon={<InfoRoundedIcon />}
              title={cardMap["whatSays"]?.title || "O que diz"}
              text={cardMap["whatSays"]?.text}
            />
            <SectionBlock
              icon={<EventRoundedIcon />}
              title={cardMap["dates"]?.title || "Datas e prazos"}
              text={cardMap["dates"]?.text}
            />
            <SectionBlock
              icon={<ListAltRoundedIcon />}
              // Remove emojis duplicados do título se a IA mandar
              title={cardMap["terms"]?.title?.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '') || "Termos importantes"}
              text={cardMap["terms"]?.text}
            />
            <SectionBlock
              icon={<HelpOutlineRoundedIcon />}
              title={cardMap["whatUsuallyHappens"]?.title || "O que costuma acontecer"}
              text={cardMap["whatUsuallyHappens"]?.text}
            />
          </Stack>

          <Box
            sx={{
              mt: 4,
              p: 2,
              bgcolor: "action.hover",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <HelpOutlineRoundedIcon sx={{ color: "primary.main" }} />
                <Typography variant="subtitle1" fontWeight={800}>
                  Perguntas sobre o documento
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                Pergunte algo especifico. A resposta e curta e informativa.
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {commonQuestions.map((q) => (
                  <Chip
                    key={q}
                    label={q}
                    size="small"
                    variant="outlined"
                    sx={{
                      bgcolor: "background.paper",
                      borderColor: "divider",
                      fontSize: "0.75rem",
                    }}
                    onClick={() => {
                      setQuestion(q);
                      if (qaAnswer) setQaAnswer(null);
                      if (qaError) setQaError(null);
                    }}
                  />
                ))}
              </Box>
              <TextField
                label="Sua pergunta"
                placeholder="Ex: Qual e o prazo?"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value.slice(0, MAX_QUESTION_CHARS));
                  if (qaAnswer) setQaAnswer(null);
                  if (qaError) setQaError(null);
                }}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Button
                  variant="contained"
                  onClick={handleAsk}
                  disabled={!canAsk}
                  size="small"
                  sx={{ fontWeight: 700, px: 3, height: 40 }}
                >
                  Perguntar
                </Button>
                {qaLoading && <CircularProgress size={20} />}
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  {question.trim().length}/{MAX_QUESTION_CHARS}
                </Typography>
              </Box>
              {qaError && <Alert severity="warning">{qaError}</Alert>}
              {qaAnswer && (
                <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>
                    Resposta
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {qaAnswer}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: "action.hover",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={800}>
                Esta explicacao foi util?
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: "wrap" }}>
                <Button
                  variant={feedbackChoice === "up" ? "contained" : "outlined"}
                  startIcon={<ThumbUpAltRoundedIcon />}
                  onClick={handleFeedbackUp}
                  disabled={feedbackLoading || feedbackSent}
                  size="small"
                  sx={{ fontWeight: 700 }}
                >
                  Sim
                </Button>
                <Button
                  variant={feedbackChoice === "down" ? "contained" : "outlined"}
                  startIcon={<ThumbDownAltRoundedIcon />}
                  onClick={handleFeedbackDown}
                  disabled={feedbackLoading || feedbackSent}
                  size="small"
                  sx={{ fontWeight: 700 }}
                >
                  Nao
                </Button>
                {feedbackLoading && <CircularProgress size={18} />}
              </Stack>

              {feedbackChoice === "down" && !feedbackSent && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
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
              {feedbackError && <Alert severity="warning">{feedbackError}</Alert>}
            </Stack>
          </Box>

          {/* --- AVISOS E RODAPÉ DO CONTEÚDO --- */}

          {/* 1. Aviso Dinâmico da IA (Só aparece se tiver observação importante) */}
          {result.notice && (
            <Box sx={{ mt: 4, mb: 2, p: 2, bgcolor: '#FFF4E5', borderRadius: 2, color: '#663C00' }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <WarningRoundedIcon sx={{ fontSize: 20, mt: 0.2, color: '#EF6C00' }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                    Observação Importante
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                    {result.notice}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* 2. Aviso Legal Padrão (Igual Home - Discreto) */}
          <Box sx={{ mt: result.notice ? 2 : 4, mb: 4, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <InfoRoundedIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                A Inteligência Artificial ajuda a entender o conteúdo, mas pode cometer erros.
                Esta ferramenta é informativa e não substitui a consulta com um profissional.
              </Typography>
            </Stack>
          </Box>
          
          <Box sx={{ height: 20 }} />

        </Container>
      </Box>

      {/* 3. Rodapé Fixo (Estilo Home) */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 10,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255,255,255,0.9)'
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<HomeRoundedIcon />}
              onClick={() => { stopSpeaking(); clearQaContext(); router.push("/"); }}
              sx={{ flex: 1, height: 56, fontWeight: 700, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
            >
              Início
            </Button>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<CameraAltRoundedIcon />}
              onClick={newDoc}
              sx={{ flex: 1, height: 56, fontWeight: 700 }}
            >
              Analisar Outro
            </Button>
          </Stack>
        </Container>
      </Box>

      <Snackbar
        open={!!toastMsg}
        autoHideDuration={3000}
        onClose={() => setToastMsg(null)}
        message={toastMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, sm: 24 } }}
      />

    </Box>
  );
}
