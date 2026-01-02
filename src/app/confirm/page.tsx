"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { saveCaptureId } from "@/lib/captureIdStore";
import { loadCapture, clearCapture } from "@/lib/captureStore";
import { compressBlobToDataUrl } from "@/lib/imageCompression";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import BlurOffRoundedIcon from "@mui/icons-material/BlurOffRounded";
import CropFreeRoundedIcon from "@mui/icons-material/CropFreeRounded";

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

  async function useThis() {
    setLoading(true);
    setErr(null);

    try {
      const payload = await loadCapture();
      if (!payload?.blob) {
        router.replace("/camera");
        return;
      }

      // 1) compressão/resize no client (Mantido sua lógica original)
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
    }
  }

  if (!previewUrl) return null;

  return (
    // Fundo PRETO total para imersão (Estilo Galeria/Instagram)
    <Box sx={{ 
      bgcolor: "#000", 
      minHeight: "100dvh", 
      display: "flex", 
      flexDirection: "column",
      color: "white"
    }}>
      
      {/* Header Flutuante (Botão Fechar) */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', position: 'absolute', top: 0, right: 0, left: 0, zIndex: 10 }}>
        <IconButton onClick={retake} sx={{ color: "white", bgcolor: 'rgba(0,0,0,0.5)' }}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      {/* Área da Imagem (Centralizada e sem cortes) */}
      <Box sx={{ 
        flex: 1, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        py: 4 // Espaço para não colar no topo/fundo
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Preview"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            boxShadow: "0 0 40px rgba(0,0,0,0.5)" // Sombra suave para destacar do fundo preto
          }}
        />

        {/* Loading Overlay (Se estiver enviando) */}
        {loading && (
          <Box sx={{
            position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: 'column', gap: 2, zIndex: 20
          }}>
            <CircularProgress sx={{ color: "white" }} />
            <Typography variant="h6" fontWeight={600}>Processando imagem...</Typography>
          </Box>
        )}
      </Box>

      {/* Rodapé com Ações */}
      <Box sx={{ 
        bgcolor: "#000", 
        p: 3, 
        pb: 4,
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Container maxWidth="sm" disableGutters>
          
          {/* Alerta de Erro (se houver) */}
          {err && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setErr(null)}>
              {err}
            </Alert>
          )}

          {/* Checklist Visual Rápido */}
          <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 3, opacity: 0.8 }}>
             <CheckItem icon={<CheckCircleRoundedIcon fontSize="small"/>} label="Legível" />
             <CheckItem icon={<BlurOffRoundedIcon fontSize="small"/>} label="Focado" />
             <CheckItem icon={<CropFreeRoundedIcon fontSize="small"/>} label="Inteiro" />
          </Stack>

          <Stack spacing={2}>
            {/* Botão Principal: BRANCO para contraste máximo no fundo preto */}
            <Button
              variant="contained"
              size="large"
              onClick={useThis}
              disabled={loading}
              sx={{ 
                bgcolor: "white", 
                color: "black",
                fontWeight: 800,
                fontSize: "1.1rem",
                '&:hover': { bgcolor: "#e0e0e0" },
                height: 56
              }}
            >
              A foto ficou boa
            </Button>

            {/* Botão Secundário */}
            <Button
              variant="text"
              size="large"
              startIcon={<ReplayRoundedIcon />}
              onClick={retake}
              disabled={loading}
              sx={{ color: "white", opacity: 0.8 }}
            >
              Tirar outra foto
            </Button>
          </Stack>
        </Container>
      </Box>

    </Box>
  );
}

// Subcomponente de Checklist Visual
function CheckItem({ icon, label }: { icon: any, label: string }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'white' }}>
      {icon}
      <Typography variant="caption" fontWeight={600}>{label}</Typography>
    </Stack>
  )
}