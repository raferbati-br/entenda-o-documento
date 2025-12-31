"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCaptureId, clearCaptureId } from "@/lib/captureIdStore";
import { saveResult } from "@/lib/resultStore";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";

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

  if (status === 410) {
    return {
      title: "A foto expirou por segurança",
      message: "Tudo bem. Para proteger sua privacidade, a foto some depois de um tempo.",
      hint: "Tire outra foto do documento e tente novamente.",
      actionLabel: "📸 Tirar nova foto",
      actionHref: "/camera",
    };
  }

  if (status === 413) {
    return {
      title: "A foto ficou muito pesada",
      message: "Isso pode acontecer quando a imagem fica grande demais.",
      hint: "Tente aproximar o documento, com boa luz, e tirar outra foto.",
      actionLabel: "📸 Tirar outra foto",
      actionHref: "/camera",
    };
  }

  if (status === 429) {
    const retry = parseRetryAfterSeconds(res!);
    return {
      title: "Muitas tentativas seguidas",
      message: retry
        ? `Aguarde cerca de ${retry} segundos e tente novamente.`
        : "Aguarde alguns segundos e tente novamente.",
      hint: "Se a internet estiver instável, isso pode acontecer.",
      actionLabel: "Voltar para a câmera",
      actionHref: "/camera",
    };
  }

  // 500/502/unknown
  return {
    title: "Não consegui entender a foto agora",
    message: apiMsg || "Ocorreu um problema ao analisar o documento.",
    hint: "Tente novamente. Se puder, tire outra foto com mais luz e mais perto do texto.",
    actionLabel: "📸 Tentar com outra foto",
    actionHref: "/camera",
  };
}

export default function AnalyzingPage() {
  const router = useRouter();
  const ran = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const [step, setStep] = useState(0);
  const [friendlyError, setFriendlyError] = useState<FriendlyError | null>(null);

  const steps = useMemo(
    () => [
      { title: "Lendo o documento…", subtitle: "Estou olhando a foto com atenção." },
      { title: "Separando as partes importantes…", subtitle: "Datas, valores e avisos." },
      { title: "Escrevendo uma explicação simples…", subtitle: "Em português claro e direto." },
    ],
    []
  );

  useEffect(() => {
    // etapas “humanas”
    const t = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 1300);

    return () => clearInterval(t);
  }, [steps.length]);

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

        if (!res.ok || !data?.ok) {
          throw { res, data };
        }

        saveResult(data.result);
        router.replace("/result");
      } catch (e: any) {
        if (e?.name === "AbortError") {
          // usuário cancelou
          return;
        }

        const res: Response | null = e?.res ?? null;
        const data = e?.data ?? null;

        // se falhou, por segurança/consistência: limpa captureId
        clearCaptureId();

        setFriendlyError(buildFriendlyError(res, data));
      }
    }

    analyze();
  }, [router]);

  const current = steps[Math.min(step, steps.length - 1)];

  if (friendlyError) {
    return (
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Card elevation={2}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={800}>
                {friendlyError.title}
              </Typography>

              <Alert severity="error">
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {friendlyError.message}
                </Typography>
              </Alert>

              {friendlyError.hint && (
                <Typography variant="body1" color="text.secondary">
                  {friendlyError.hint}
                </Typography>
              )}

              <Stack spacing={1.2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => router.push(friendlyError.actionHref || "/camera")}
                  sx={{ py: 1.4 }}
                >
                  {friendlyError.actionLabel || "📸 Tirar outra foto"}
                </Button>

                <Button variant="text" size="large" onClick={() => router.push("/")}>
                  Voltar ao início
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Card elevation={2}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={800}>
              {current.title}
            </Typography>

            <Typography color="text.secondary" variant="body1">
              {current.subtitle}
            </Typography>

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 2,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={22} />
                <Typography color="text.secondary" variant="body1">
                  Isso pode levar alguns segundos. Se puder, não feche esta tela.
                </Typography>
              </Stack>
            </Box>

            <Button
              variant="outlined"
              size="large"
              sx={{ py: 1.2 }}
              onClick={() => {
                abortRef.current?.abort();
                clearCaptureId();
                router.push("/camera");
              }}
            >
              Cancelar e tirar outra foto
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
