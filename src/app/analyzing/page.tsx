"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCaptureId } from "@/lib/captureIdStore";
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

export default function AnalyzingPage() {
  const router = useRouter();
  const ran = useRef(false); // ✅ evita execução dupla em dev (Strict Mode)
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function analyze() {
      const captureId = loadCaptureId();
      if (!captureId) {
        router.replace("/");
        return;
      }

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ captureId }),
        });

        const data = await res.json();

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Erro desconhecido");
        }

        saveResult(data.result);
        router.replace("/result");
      } catch (e: any) {
        setError(e?.message || "Erro ao analisar documento");
      }
    }

    analyze();
  }, [router]);

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Card elevation={2}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={800}>
                Não foi possível analisar
              </Typography>

              <Alert severity="error">
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {error}
                </Typography>
              </Alert>

              <Typography variant="body2" color="text.secondary">
                Tente novamente. Se o erro continuar, envie outra foto mais próxima e com boa iluminação.
              </Typography>

              <Button variant="outlined" size="large" onClick={() => router.push("/camera")}>
                Voltar para a câmera
              </Button>
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
              Analisando…
            </Typography>

            <Typography color="text.secondary">
              Estou lendo o documento e preparando a explicação.
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
                <Typography color="text.secondary">⏳ Isso pode levar alguns segundos.</Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
