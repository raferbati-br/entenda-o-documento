"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { loadCaptureId, clearCaptureId } from "@/lib/captureIdStore";
import { saveResult } from "@/lib/resultStore";
import { motion, AnimatePresence } from "framer-motion"; // Instale: npm install framer-motion
import { clearSessionToken, ensureSessionToken } from "@/lib/sessionToken";
import { clearQaContext, saveQaContext } from "@/lib/qaContextStore";
import { markLatencyTrace, recordLatencyStep } from "@/lib/latencyTrace";
import { telemetryCapture } from "@/lib/telemetry";
import { buildAnalyzeFriendlyError, type FriendlyError } from "@/lib/errorMesages";
import { isRecord } from "@/lib/typeGuards";

import { Box, Button, Container, Stack, Typography, LinearProgress } from "@mui/material";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PageLayout from "../_components/PageLayout";
import Notice from "../_components/Notice";

export default function AnalyzingPage() {
  const router = useRouter();
  const ran = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const [step, setStep] = useState(0);
  const [friendlyError, setFriendlyError] = useState<FriendlyError | null>(null);

  // Mensagens para feedback visual
  const steps = useMemo(
    () => [
      "Lendo o documento...",
      "Identificando termos técnicos...",
      "Traduzindo juridiquês...",
      "Gerando explicação simples...",
      "Quase pronto..."
    ],
    []
  );

  // Timer para avançar as mensagens
  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 2500);
    return () => clearInterval(t);
  }, [steps.length]);

  // Chamada da API (Sua lógica original mantida 100%)
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function analyze() {
      const captureId = loadCaptureId();
      if (!captureId) {
        router.replace("/");
        return;
      }

      const attemptKey = `analyze_attempt:${captureId}`;
      const attempt = Number(sessionStorage.getItem(attemptKey) || "0") + 1;
      sessionStorage.setItem(attemptKey, String(attempt));

      clearQaContext();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        telemetryCapture("analyze_start");
        const token = await ensureSessionToken();
        const ocrStart = performance.now();
        const ocrRes = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { "x-session-token": token } : {}) },
          body: JSON.stringify({ captureId, attempt }),
          signal: controller.signal,
        });

        const ocrData = await ocrRes.json().catch(() => ({}));
        const ocrDurationMs = performance.now() - ocrStart;
        recordLatencyStep("ocr_ms", ocrDurationMs);
        telemetryCapture("openai_ocr_latency", {
          ms: Math.round(ocrDurationMs),
          attempt,
          status: ocrRes.status,
        });
        let ocrText = "";
        if (ocrRes.ok && ocrData?.ok && typeof ocrData?.documentText === "string" && ocrData.documentText.trim()) {
          ocrText = ocrData.documentText.trim();
          saveQaContext(ocrText);
        }

        const analyzeStart = performance.now();
        const analyzePayload = { captureId, attempt, ...(ocrText ? { ocrText } : {}) };
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { "x-session-token": token } : {}) },
          body: JSON.stringify(analyzePayload),
          signal: controller.signal,
        });

        const data = await res.json().catch(() => ({}));
        const analyzeDurationMs = performance.now() - analyzeStart;
        recordLatencyStep("analyze_ms", analyzeDurationMs);
        telemetryCapture("openai_cards_latency", {
          ms: Math.round(analyzeDurationMs),
          attempt,
          status: res.status,
        });
        if (!res.ok || !data?.ok) throw { res, data };

        saveResult(data.result);
        markLatencyTrace("analyze_done");
        telemetryCapture("analyze_success");
        router.replace("/result");
      } catch (e: unknown) {
        const err = isRecord(e) ? e : {};
        const name = typeof err.name === "string" ? err.name : "";
        if (name === "AbortError") return;
        const res = err.res instanceof Response ? err.res : null;
        const data = err.data ?? null;
        telemetryCapture("analyze_error", {
          status: res?.status ?? 0,
          error: isRecord(data) && typeof data.error === "string" ? data.error : "unknown",
        });
        if (res?.status === 401) {
          clearSessionToken().catch(() => {});
        }
        clearCaptureId();
        setFriendlyError(buildAnalyzeFriendlyError(res, data));
      }
    }

    analyze();
  }, [router]);

  // ================= ERROR STATE =================
  if (friendlyError) {
    return (
      <PageLayout contentPaddingTop={0} contentPaddingBottom={0} contentPaddingX={0} disableContainer>
        <Container
          maxWidth="sm"
          sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", py: 4 }}
        >
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Notice severity="error" variant="hero" title={friendlyError.title}>
              {friendlyError.message}
            </Notice>
            {friendlyError.hint && (
              <Notice severity="info" sx={{ width: "100%" }}>
                {friendlyError.hint}
              </Notice>
            )}
            <Box sx={{ width: "100%", pt: 2 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<CameraAltRoundedIcon />}
                onClick={() => router.push(friendlyError.actionHref || "/camera")}
                sx={{ mb: 2 }}
              >
                {friendlyError.actionLabel}
              </Button>
              <Button variant="text" onClick={() => router.push("/")}>
                Cancelar e voltar
              </Button>
            </Box>
          </Stack>
        </Container>
      </PageLayout>
    );
  }

  // ================= LOADING STATE (COM ANIMAÇÃO) =================
  return (
    <PageLayout contentPaddingTop={0} contentPaddingBottom={0} contentPaddingX={0} disableContainer>
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          p: 3,
        }}
      >
        <Container maxWidth="xs" sx={{ textAlign: "center" }}>
          {/* Ícone Pulsando */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                bgcolor: "primary.main",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 4,
                mx: "auto",
                boxShadow: "0 0 20px rgba(0,102,204,0.4)",
              }}
            >
              <AutoAwesomeRoundedIcon sx={{ fontSize: 40, color: "white" }} />
            </Box>
          </motion.div>

          {/* Texto Animado (Fade In/Out) */}
          <Box sx={{ height: 60, mb: 2 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  {steps[step]}
                </Typography>
              </motion.div>
            </AnimatePresence>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            A inteligência artificial está analisando cada detalhe.
          </Typography>

          {/* Barra de Progresso */}
          <LinearProgress
            sx={{
              height: 6,
              borderRadius: 4,
              bgcolor: "action.hover",
              maxWidth: 200,
              mx: "auto",
              "& .MuiLinearProgress-bar": { borderRadius: 4 },
            }}
          />

          {/* Botão Cancelar Discreto */}
          <Button
            size="small"
            color="inherit"
            onClick={() => {
              abortRef.current?.abort();
              clearCaptureId();
              router.push("/camera");
            }}
            sx={{ mt: 8, color: "text.disabled", fontSize: "0.75rem" }}
          >
            Cancelar
          </Button>
        </Container>
      </Box>
    </PageLayout>
  );
}
