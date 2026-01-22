"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCapture } from "@/lib/captureStore";
import { loadQaContext } from "@/lib/qaContextStore";
import { loadResult, AnalysisResult } from "@/lib/resultStore";
import { ensureSessionToken } from "@/lib/sessionToken";
import { telemetryCapture } from "@/lib/telemetry";
import SectionBlock from "../_components/SectionBlock";
import Disclaimer from "../_components/Disclaimer";

import { Box, Button, Chip, IconButton, TextField, Stack, Typography, CircularProgress } from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import ActionBar from "../_components/ActionBar";
import PageHeader from "../_components/PageHeader";
import PageLayout from "../_components/PageLayout";
import Notice from "../_components/Notice";

type CardT = { id: string; title: string; text: string };

const MAX_QUESTION_CHARS = 240;
const MIN_QUESTION_CHARS = 4;
const MAX_CONTEXT_CHARS = 3500;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export default function PerguntasPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const [question, setQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [qaError, setQaError] = useState<string | null>(null);
  const [qaLoading, setQaLoading] = useState(false);

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

  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, Number((z + ZOOM_STEP).toFixed(2))));
  }

  function zoomOut() {
    setZoom((z) => Math.max(MIN_ZOOM, Number((z - ZOOM_STEP).toFixed(2))));
  }

  function resetZoom() {
    setZoom(1);
  }

  async function handleAsk() {
    const q = question.trim();
    if (!q || q.length < MIN_QUESTION_CHARS || q.length > MAX_QUESTION_CHARS) return;
    if (!qaContext) {
      setQaError("Nao foi possivel montar o contexto do documento.");
      return;
    }

    const attemptKey = `qa_attempt:${q.toLowerCase()}`;
    const attempt = Number(sessionStorage.getItem(attemptKey) || "0") + 1;
    sessionStorage.setItem(attemptKey, String(attempt));

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
        body: JSON.stringify({ question: q, context: qaContext, attempt }),
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

  if (!result) return null;

  return (
    <PageLayout
      header={
        <PageHeader>
          <IconButton edge="start" onClick={() => router.push("/result")} sx={{ mr: 1 }}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Perguntas
          </Typography>
        </PageHeader>
      }
      footer={
        <ActionBar>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<HomeRoundedIcon />}
              onClick={() => router.push("/")}
              sx={{ flex: 1, height: 56, fontWeight: 700, borderWidth: 2, "&:hover": { borderWidth: 2 } }}
            >
              Início
            </Button>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => router.push("/result")}
              sx={{ flex: 1, height: 56, fontWeight: 700, borderWidth: 2, "&:hover": { borderWidth: 2 } }}
            >
              Resultado
            </Button>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<CameraAltRoundedIcon />}
              onClick={() => router.push("/camera")}
              sx={{ flex: 1, height: 56, fontWeight: 700 }}
            >
              Analisar Outro
            </Button>
          </Stack>
        </ActionBar>
      }
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" gutterBottom fontWeight={800}>
            Tire suas duvidas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Veja o documento e faca perguntas especificas. A resposta e curta e informativa.
          </Typography>
        </Box>

            <Box
              sx={{
                p: 2,
                bgcolor: "action.hover",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <SectionBlock
                icon={<DescriptionRoundedIcon fontSize="inherit" />}
                title={documentTitle}
                actions={
                  <>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(zoom * 100)}%
                    </Typography>
                    <IconButton onClick={zoomOut} disabled={!imageUrl || !canZoomOut}>
                      <ZoomOutRoundedIcon />
                    </IconButton>
                    <IconButton onClick={zoomIn} disabled={!imageUrl || !canZoomIn}>
                      <ZoomInRoundedIcon />
                    </IconButton>
                    <IconButton onClick={resetZoom} disabled={!imageUrl || zoom === 1}>
                      <RestartAltRoundedIcon />
                    </IconButton>
                  </>
                }
              >
                <Box sx={{ bgcolor: "#000", borderRadius: 2, overflow: "auto", maxHeight: "55vh" }}>
                  {imageUrl ? (
                    <Box sx={{ width: `${zoom * 100}%`, transformOrigin: "top center" }}>
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
              </SectionBlock>
            </Box>

            <Box
              sx={{
                p: 2,
                bgcolor: "action.hover",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <SectionBlock icon={<HelpOutlineRoundedIcon fontSize="inherit" />} title="Sua pergunta">
                <Stack spacing={1.25}>
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
                  {qaError && <Notice severity="warning">{qaError}</Notice>}
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
              </SectionBlock>
            </Box>
        <Button
          variant="text"
          onClick={() => router.push("/result")}
          sx={{ alignSelf: "flex-start", fontWeight: 600 }}
        >
          Voltar ao resultado
        </Button>
        <Disclaimer />
      </Stack>
    </PageLayout>
  );
}
