"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { saveCaptureId } from "@/lib/captureIdStore";
import { loadCapture, clearCapture } from "@/lib/captureStore";
import { compressBlobToDataUrl } from "@/lib/imageCompression";
import { ensureSessionToken } from "@/lib/sessionToken";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Backdrop,
} from "@mui/material";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

export default function ConfirmPage() {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Carrega a imagem do IndexedDB/Store
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
    router.replace("/camera");
  }

  async function handleConfirm() {
    setLoading(true);
    setErr(null);

    try {
      const payload = await loadCapture();
      if (!payload?.blob) {
        router.replace("/camera");
        return;
      }

      // 1) Lógica de Compressão (Mantida do seu arquivo original)
      let { dataUrl, bytes } = await compressBlobToDataUrl(payload.blob, {
        maxDimension: 1600,
        quality: 0.78,
        mimeType: "image/jpeg",
      });

      if (bytes > 1_700_000) {
        const second = await compressBlobToDataUrl(payload.blob, {
          maxDimension: 1400,
          quality: 0.72,
          mimeType: "image/jpeg",
        });
        dataUrl = second.dataUrl;
        bytes = second.bytes;
      }

      // 2) Envio para API
      const token = await ensureSessionToken();
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-session-token": token } : {}) },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Erro ao enviar imagem");
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
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", bgcolor: "#000" }}>
      
      {/* 1. Header Escuro (Imersivo para foto) */}
      <AppBar 
        position="fixed" 
        color="transparent" 
        elevation={0} 
        sx={{ bgcolor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      >
        <Toolbar>
          <IconButton onClick={retake} sx={{ color: "white" }}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="h6" sx={{ color: "white", ml: 1, fontWeight: 600 }}>
            Confira a foto
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 2. Área da Imagem (Centralizada) */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'hidden',
          pt: 7, // Espaço do Header
          pb: 12, // Espaço do Footer
          bgcolor: '#000',
          position: 'relative'
        }}
      >
        {/* Imagem ajustada na tela (contain) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={previewUrl} 
          alt="Captura" 
          style={{ 
            maxWidth: "100%", 
            maxHeight: "100%", 
            objectFit: "contain" 
          }} 
        />
      </Box>

      {/* 3. Rodapé Fixo Branco (Com botões lado a lado) */}
      <Box 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          p: 3, 
          bgcolor: 'background.paper', // Fundo branco
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          zIndex: 10
        }}
      >
        <Container maxWidth="sm" disableGutters>
          
          {err && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr(null)}>
              {err}
            </Alert>
          )}

          <Stack spacing={2}>
            <Typography variant="subtitle1" align="center" fontWeight={700}>
              Dá para ler o texto?
            </Typography>

            <Stack direction="row" spacing={2}>
              {/* Botão Secundário: Tirar Outra */}
              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<ReplayRoundedIcon />}
                onClick={retake}
                disabled={loading}
                sx={{ height: 56, fontWeight: 700, borderRadius: 3, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
              >
                Tirar outra
              </Button>

              {/* Botão Principal: Sim, usar */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={handleConfirm}
                disabled={loading}
                sx={{ height: 56, fontWeight: 700, borderRadius: 3, boxShadow: 'none' }}
              >
                Sim, usar
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Loading Overlay */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column', gap: 2 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6">Processando imagem...</Typography>
      </Backdrop>

    </Box>
  );
}
