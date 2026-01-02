"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCaptureId, clearCaptureId } from "@/lib/captureIdStore";
import { saveResult } from "@/lib/resultStore";

import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  Skeleton,
  Typography,
  LinearProgress,
} from "@mui/material";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";

// === Tipos e Helpers de Erro (Mantidos iguais, só a UI muda) ===
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

  // Lógica de erro mantida idêntica para não quebrar regras de negócio
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

  // Passos de carregamento para feedback visual
  const steps = useMemo(
    () => [
      { title: "Lendo o documento...", subtitle: "Identificando o texto na imagem" },
      { title: "Separando o importante...", subtitle: "Buscando datas, valores e avisos" },
      { title: "Escrevendo explicação...", subtitle: "Traduzindo para português simples" },
    ],
    []
  );

  // Timer para avançar a barra de progresso visualmente
  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 2000); // Um pouco mais lento para dar tempo da API responder
    return () => clearInterval(t);
  }, [steps.length]);

  // Chamada da API
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function analyze() {
      const captureId = loadCaptureId();
      if (!captureId) {
        router.replace("/");
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ captureId }),
          signal: controller.signal,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw { res, data };

        saveResult(data.result);
        router.replace("/result");
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        const res: Response | null = e?.res ?? null;
        const data = e?.data ?? null;
        clearCaptureId();
        setFriendlyError(buildFriendlyError(res, data));
      }
    }

    analyze();
  }, [router]);

  // ================= ERROR STATE =================
  if (friendlyError) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", py: 4 }}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          <ErrorOutlineRoundedIcon sx={{ fontSize: 64, color: "error.main", opacity: 0.8 }} />
          
          <Box>
            <Typography variant="h5" gutterBottom fontWeight={800}>
              {friendlyError.title}
            </Typography>
            <Typography color="text.secondary" variant="body1">
              {friendlyError.message}
            </Typography>
          </Box>

          {friendlyError.hint && (
            <Alert severity="info" sx={{ width: '100%', borderRadius: 3 }}>
              {friendlyError.hint}
            </Alert>
          )}

          <Box sx={{ width: '100%', pt: 2 }}>
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
    );
  }

  // ================= LOADING STATE (SKELETON) =================
  const current = steps[Math.min(step, steps.length - 1)];
  const progressValue = ((step + 1) / steps.length) * 100;

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100dvh", pt: 6, px: 3 }}>
      <Stack spacing={4}>
        
        {/* Cabeçalho do Loading */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, color: "primary.main" }}>
            <AutoAwesomeRoundedIcon fontSize="small" />
            <Typography variant="subtitle2" fontWeight={700}>ANALISANDO A FOTO</Typography>
          </Stack>
          
          <Typography variant="h4" gutterBottom>
            {current.title}
          </Typography>
          <Typography color="text.secondary" variant="body1">
            {current.subtitle}
          </Typography>
        </Box>

        {/* Barra de Progresso Realista */}
        <Box>
           <LinearProgress 
            variant="determinate" 
            value={progressValue} 
            sx={{ height: 8, borderRadius: 4, mb: 1 }} 
           />
           <Typography variant="caption" color="text.secondary" align="right" display="block">
             Passo {Math.min(step + 1, 3)} de 3
           </Typography>
        </Box>

        {/* Skeleton UI: Simula o resultado aparecendo */}
        <Stack spacing={2} sx={{ opacity: 0.6 }}>
          <Skeleton variant="rectangular" height={24} width="60%" sx={{ borderRadius: 1 }} />
          <Skeleton variant="text" height={20} />
          <Skeleton variant="text" height={20} />
          <Skeleton variant="text" height={20} width="80%" />
          
          <Box sx={{ py: 2 }}>
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
          </Box>
          
          <Skeleton variant="text" height={20} />
          <Skeleton variant="text" height={20} width="90%" />
        </Stack>

        {/* Botão de Cancelar Fixo ou no fim */}
        <Box sx={{ mt: 'auto', pt: 4, pb: 4, textAlign: 'center' }}>
          <Button
            color="inherit"
            onClick={() => {
              abortRef.current?.abort();
              clearCaptureId();
              router.push("/camera");
            }}
            sx={{ color: 'text.secondary', opacity: 0.8 }}
          >
            Demorando muito? Cancelar
          </Button>
        </Box>

      </Stack>
    </Container>
  );
}