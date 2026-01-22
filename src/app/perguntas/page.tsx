"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCapture } from "@/lib/captureStore";
import { loadQaContext } from "@/lib/qaContextStore";
import { loadResult, AnalysisResult } from "@/lib/resultStore";
import { ensureSessionToken } from "@/lib/sessionToken";
import { telemetryCapture } from "@/lib/telemetry";
import Disclaimer from "../_components/Disclaimer";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import ActionBar from "../_components/ActionBar";
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

export default function PerguntasPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [docOpen, setDocOpen] = useState(false);
  const [docZoom, setDocZoom] = useState(1);

  const [question, setQuestion] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<QaItem[]>([]);

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

  useEffect(() => {
    if (!qaHistory.length) return;
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [qaHistory, qaLoading]);

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

  function handleQuickQuestion(q: string) {
    if (q === "Outras") {
      setQuestion("");
      inputRef.current?.focus();
      return;
    }
    setQuestion(q);
    inputRef.current?.focus();
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
    setQaHistory((prev) => [...prev, { id: itemId, question: q, pending: true }]);
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Falha ao responder.");
      }

      setQaHistory((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, pending: false, answer: String(data?.answer || "") } : item))
      );
      telemetryCapture("qa_answer_success");
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "Nao foi possivel responder agora.";
      setQaHistory((prev) => prev.map((item) => (item.id === itemId ? { ...item, pending: false, error: msg } : item)));
      telemetryCapture("qa_answer_error");
    } finally {
      setQaLoading(false);
    }
  }

  if (!result) return null;

  return (
    <>
      <PageLayout
        contentPaddingBottom={22}
        header={
          <PageHeader>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Perguntas
            </Typography>
          </PageHeader>
        }
        footer={
          <ActionBar>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<HelpOutlineRoundedIcon />}
                  onClick={() => router.push("/result")}
                  sx={{ height: 48, fontWeight: 700, borderWidth: 2, "&:hover": { borderWidth: 2 } }}
                >
                  Resultado
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<DescriptionRoundedIcon />}
                  onClick={openDocument}
                  disabled={!imageUrl}
                  sx={{ height: 48, fontWeight: 700, borderWidth: 2, "&:hover": { borderWidth: 2 } }}
                >
                  Documento
                </Button>
              </Stack>

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
                    onClick={() => handleQuickQuestion(q)}
                  />
                ))}
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center">
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
                <Button
                  variant="contained"
                  onClick={handleAsk}
                  disabled={!canAsk}
                  sx={{ height: 40, fontWeight: 700, px: 3 }}
                >
                  Perguntar
                </Button>
              </Stack>
            </Stack>
          </ActionBar>
        }
      >
        <Stack spacing={2} sx={{ minHeight: "100%" }}>
          <Box sx={{ position: "sticky", top: 0, zIndex: 1, bgcolor: "background.default", pb: 1 }}>
            <Typography variant="h5" gutterBottom fontWeight={800}>
              Tire suas duvidas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Veja o documento e faca perguntas especificas. A resposta e curta e informativa.
            </Typography>
          </Box>

          <Stack spacing={2} sx={{ flexGrow: 1 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Perguntas e respostas
              </Typography>
              <Typography variant="caption" color="text.secondary">
                As conversas ficam aqui enquanto voce pergunta.
              </Typography>
            </Box>
            {qaHistory.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Escolha uma pergunta rapida ou escreva a sua.
              </Typography>
            ) : (
              <Stack spacing={2}>
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

                    {item.pending && (
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
                <Box ref={endRef} />
              </Stack>
            )}
          </Stack>

          <Disclaimer />
        </Stack>
      </PageLayout>

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
    </>
  );
}
