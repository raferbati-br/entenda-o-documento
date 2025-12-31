"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCaptureId } from "@/lib/captureIdStore";
import { loadCapture, clearCapture } from "@/lib/captureStore";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

export default function ConfirmPage() {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    (async () => {
      const payload = await loadCapture();
      if (!payload?.blob) {
        router.replace("/camera");
        return;
      }
      objectUrl = URL.createObjectURL(payload.blob);
      setPreviewUrl(objectUrl);
    })();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [router]);

  async function retake() {
    await clearCapture();
    router.push("/camera");
  }

  async function useThis() {
    setLoading(true);
    setErr(null);

    try {
      const payload = await loadCapture();
      if (!payload?.blob) {
        router.replace("/camera");
        return;
      }

      const imageBase64 = await blobToDataUrl(payload.blob);

      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Erro ao enviar imagem";
        throw new Error(msg);
      }

      saveCaptureId(data.captureId);
      router.push("/analyzing");
    } catch (e: any) {
      setLoading(false);
      setErr(e?.message || "Falha ao enviar imagem");
    }
  }

  if (!previewUrl) return null;

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Card elevation={2}>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack spacing={1}>
              <Typography variant="h5" fontWeight={900}>
                A foto ficou boa?
              </Typography>
              <Typography color="text.secondary" variant="body1">
                Se estiver escuro, borrado ou cortado, vale tirar outra foto.
              </Typography>
            </Stack>

            {err && (
              <Alert severity="error" icon={false}>
                <Typography fontWeight={800}>Não deu certo</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                  {err}
                  {"\n"}
                  Se puder, tente novamente com mais luz e aproximando mais o texto.
                </Typography>
              </Alert>
            )}

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 1,
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Foto do documento"
                style={{ width: "100%", display: "block" }}
              />
            </Box>

            <Button
              variant="text"
              size="large"
              onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
            >
              🔎 Tocar para ampliar
            </Button>

            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
              <CardContent>
                <Typography fontWeight={800} sx={{ mb: 1 }}>
                  Antes de continuar, confira:
                </Typography>
                <List dense sx={{ p: 0 }}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="• Consigo ver as letras" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="• Não está escuro" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="• O documento aparece inteiro" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Stack spacing={1.5}>
              <Button
                variant="contained"
                size="large"
                onClick={useThis}
                disabled={loading}
                sx={{ py: 1.4 }}
              >
                {loading ? "Enviando…" : "✅ Usar esta foto"}
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={retake}
                disabled={loading}
                sx={{ py: 1.4 }}
              >
                🔄 Tirar outra foto
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Privacidade: a imagem é usada apenas para gerar a explicação e não é armazenada permanentemente.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Falha ao ler imagem"));
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
}
