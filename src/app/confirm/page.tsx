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

import PremiumHeader from "@/components/PremiumHeader";
import BottomActionBar from "@/components/BottomActionBar";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { compressBlobToDataUrl } from "@/lib/imageCompression";


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

      // 1) compressão/resize no client (MVP)
      let { dataUrl, bytes } = await compressBlobToDataUrl(payload.blob, {
        maxDimension: 1600,
        quality: 0.78,
        mimeType: "image/jpeg",
      });

      // 2) segundo passe se ainda estiver grande (evita 413 e melhora latência)
      if (bytes > 1_700_000) {
        const second = await compressBlobToDataUrl(payload.blob, {
          maxDimension: 1400,
          quality: 0.72,
          mimeType: "image/jpeg",
        });
        dataUrl = second.dataUrl;
        bytes = second.bytes;
      }

      // Continua compatível com seu /api/capture: manda DataURL
      const imageBase64 = dataUrl;

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
    <Container
      maxWidth="sm"
      sx={{
        py: 3,
        // espaço para o BottomActionBar fixo
        pb: "calc(env(safe-area-inset-bottom) + 140px)",
      }}
    >
      <PremiumHeader
        title="A foto ficou boa?"
        subtitle="Se estiver escuro, borrado ou cortado, vale tirar outra foto."
        chips={[
          { icon: <AutoAwesomeRoundedIcon />, label: "Melhor foto = melhor explicação" },
          { icon: <LockRoundedIcon />, label: "Privacidade" },
        ]}
      />

      <Stack spacing={2.2}>
        {err && (
          <Alert severity="error" icon={false}>
            <Typography fontWeight={900}>Não deu certo</Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
              {err}
              {"\n"}Tente novamente com mais luz e aproximando mais o texto.
            </Typography>
          </Alert>
        )}

        <Card elevation={1}>
          <CardContent>
            <Stack spacing={1.2}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
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
                startIcon={<ZoomInRoundedIcon />}
                onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
              >
                Tocar para ampliar
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card elevation={1}>
          <CardContent>
            <Typography fontWeight={900} sx={{ mb: 1 }}>
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

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2 }}>
              Privacidade: a foto é usada apenas para gerar a explicação e não é armazenada permanentemente.
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <BottomActionBar>
        <Button
          variant="contained"
          size="large"
          onClick={useThis}
          disabled={loading}
          startIcon={<CheckCircleRoundedIcon />}
        >
          {loading ? "Enviando…" : "Usar esta foto"}
        </Button>

        <Button
          variant="outlined"
          size="large"
          onClick={retake}
          disabled={loading}
          startIcon={<ReplayRoundedIcon />}
        >
          Tirar outra foto
        </Button>
      </BottomActionBar>
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
