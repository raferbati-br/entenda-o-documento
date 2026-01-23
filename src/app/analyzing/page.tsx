"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { loadCaptureId, clearCaptureId } from "@/lib/captureIdStore";
import { saveResult } from "@/lib/resultStore";
import { motion, AnimatePresence } from "framer-motion"; // Instale: npm install framer-motion
import { clearSessionToken, ensureSessionToken } from "@/lib/sessionToken";
import { clearQaContext, saveQaContext } from "@/lib/qaContextStore";
import { telemetryCapture } from "@/lib/telemetry";

import { Box, Button, Container, Stack, Typography, LinearProgress } from "@mui/material";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PageLayout from "../_components/PageLayout";
import Notice from "../_components/Notice";

// === Tipos e Helpers de Erro (Mantidos) ===
type FriendlyError = {
  title: string;
  message: string;
  hint?: string;
  actionLabel?: string;
  actionHref?: string;
};

function parseRetryAfterSeconds(res: Response) {
  const v = res.headers.get("Retry-After");
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : null;
}

function buildFriendlyError(res: Response | null, data: any): FriendlyError {
  const apiMsg = typeof data?.error === "string" ? data.error : "";
  const status = res?.status ?? 0;

  if (status === 401)
    return {
      title: "Sessao expirada",
      message: "O tempo da sua sessao acabou.",
      hint: "Tire outra foto para continuar.",
      actionLabel: "Tirar nova foto",
      actionHref: "/camera",
    };

  if (status === 410) return { title: "A foto expirou", message: "Por segurança, a foto foi apagada.", hint: "Tire outra foto.", actionLabel: "Tirar nova foto", actionHref: "/camera" };
  if (status === 413) return { title: "Foto muito pesada", message: "A imagem ficou grande demais.", hint: "Tente aproximar o documento.", actionLabel: "Tirar outra foto", actionHref: "/camera" };
  if (status === 429) {
    const retry = parseRetryAfterSeconds(res!);
    return { title: "Muitas tentativas", message: retry ? `Aguarde ${retry}s.` : "Aguarde um pouco.", hint: "Sua internet pode estar oscilando.", actionLabel: "Voltar", actionHref: "/camera" };
  }
  return { title: "Não entendi a foto", message: apiMsg || "Ocorreu um problema.", hint: "Tente com mais luz.", actionLabel: "Tentar outra foto", actionHref: "/camera" };
}

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
        const ocrRes = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { "x-session-token": token } : {}) },
          body: JSON.stringify({ captureId, attempt }),
          signal: controller.signal,
        });

        const ocrData = await ocrRes.json().catch(() => ({}));
        if (ocrRes.ok && ocrData?.ok && typeof ocrData?.documentText === "string" && ocrData.documentText.trim()) {
          saveQaContext(ocrData.documentText);
        }

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { "x-session-token": token } : {}) },
          body: JSON.stringify({ captureId, attempt }),
          signal: controller.signal,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw { res, data };

        saveResult(data.result);
        telemetryCapture("analyze_success");
        router.replace("/result");
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        const res: Response | null = e?.res ?? null;
        const data = e?.data ?? null;
        telemetryCapture("analyze_error", {
          status: res?.status ?? 0,
          error: typeof data?.error === "string" ? data.error : "unknown",
        });
        if (res?.status === 401) {
          clearSessionToken().catch(() => {});
        }
        clearCaptureId();
        setFriendlyError(buildFriendlyError(res, data));
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
