"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { saveCaptureId } from "@/lib/captureIdStore";
import { loadCapture, clearCapture } from "@/lib/captureStore";
import { compressBlobToDataUrl } from "@/lib/imageCompression";

import Screen from "@/components/Screen";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";

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

      // 2) segundo passe se ainda estiver grande
      if (bytes > 1_700_000) {
        const second = await compressBlobToDataUrl(payload.blob, {
          maxDimension: 1400,
          quality: 0.72,
          mimeType: "image/jpeg",
        });
        dataUrl = second.dataUrl;
        bytes = second.bytes;
      }

      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl }),
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
      return;
    }

    // só se deu certo a gente mantém loading até navegar
  }

  if (!previewUrl) return null;

  return (
    <Screen
      header={{
        title: "A foto ficou boa?",
        subtitle: "Se estiver escuro, borrado ou cortado, vale tirar outra foto.",
        chips: [
          { icon: <AutoAwesomeRoundedIcon />, label: "Melhor foto = melhor explicação" },
          { icon: <LockRoundedIcon />, label: "Privacidade" },
        ],
      }}
      bottomBar={
        <>
          <Button
            variant="contained"
            size="large"
            startIcon={<CheckCircleRoundedIcon />}
            onClick={useThis}
            disabled={loading}
            sx={{ py: 1.4 }}
          >
            {loading ? "Enviando…" : "Usar esta foto"}
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<ReplayRoundedIcon />}
            onClick={retake}
            disabled={loading}
            sx={{ py: 1.4 }}
          >
            Tirar outra foto
          </Button>
        </>
      }
    >
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

        {/* Preview */}
        <Card elevation={2}>
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

        {/* Checklist */}
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
    </Screen>
  );
}
