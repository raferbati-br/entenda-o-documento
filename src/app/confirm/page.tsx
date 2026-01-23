"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { saveCaptureId } from "@/lib/captureIdStore";
import { loadCapture, clearCapture } from "@/lib/captureStore";
import { compressBlobToDataUrl } from "@/lib/imageCompression";
import { clearSessionToken, ensureSessionToken } from "@/lib/sessionToken";
import { telemetryCapture } from "@/lib/telemetry";

import { Box, CircularProgress, Typography, IconButton, Backdrop } from "@mui/material";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import FooterActions from "../_components/FooterActions";
import PageHeader from "../_components/PageHeader";
import PageLayout from "../_components/PageLayout";
import Notice from "../_components/Notice";

export default function ConfirmPage() {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 3;

  function getPinchDistance(touches: TouchList) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function clampZoom(nextZoom: number) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
  }


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

    telemetryCapture("confirm_open");

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [router]);

  async function retake() {
    await clearCapture();
    telemetryCapture("confirm_retake");
    router.replace("/camera");
  }

  async function handleConfirm() {
    setLoading(true);
    setErr(null);
    telemetryCapture("confirm_submit");

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
      if (res.status === 401) {
        await clearSessionToken();
      }
      if (!res.ok || !data?.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Erro ao enviar imagem");
      }

      saveCaptureId(data.captureId);
      router.push("/analyzing");

    } catch (e: any) {
      setLoading(false);
      setErr(e?.message || "Falha ao enviar imagem");
      telemetryCapture("confirm_error");
    }
  }

  if (!previewUrl) return null;

  return (
    <PageLayout
      background="#000"
      contentPaddingTop={0}
      contentPaddingBottom={0}
      contentPaddingX={0}
      disableContainer
      header={
        <PageHeader sx={{ borderBottom: "none", bgcolor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <IconButton onClick={retake} sx={{ color: "white" }}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="h6" sx={{ color: "white", ml: 1, fontWeight: 600 }}>
            Confira a imagem
          </Typography>
        </PageHeader>
      }
      footer={
        <FooterActions
          leadingContent={
            err && (
              <Notice severity="error" onClose={() => setErr(null)}>
                {err}
              </Notice>
            )
          }
          secondary={{
            label: "Escolher outra",
            startIcon: <ReplayRoundedIcon />,
            onClick: retake,
            disabled: loading,
          }}
          primary={{
            label: "Usar esta imagem",
            startIcon: <CheckCircleRoundedIcon />,
            onClick: handleConfirm,
            disabled: loading,
          }}
        />
      }
    >
      <Box sx={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
        {/* Área da Imagem (Centralizada) */}
        <Box
          onTouchStart={(e) => {
            if (e.touches.length !== 2) return;
            pinchStartDistanceRef.current = getPinchDistance(e.touches as unknown as TouchList);
            pinchStartScaleRef.current = zoom;
          }}
          onTouchMove={(e) => {
            if (e.touches.length !== 2 || !pinchStartDistanceRef.current) return;
            e.preventDefault();
            const distance = getPinchDistance(e.touches as unknown as TouchList);
            const nextZoom = clampZoom(pinchStartScaleRef.current * (distance / pinchStartDistanceRef.current));
            setZoom(Number(nextZoom.toFixed(2)));
          }}
          onTouchEnd={(e) => {
            if (e.touches.length < 2) {
              pinchStartDistanceRef.current = null;
            }
          }}
          onTouchCancel={() => {
            pinchStartDistanceRef.current = null;
          }}
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            pt: 7,
            pb: 12,
            bgcolor: "#000",
            position: "relative",
            touchAction: "none",
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
              objectFit: "contain",
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
            }}
          />
        </Box>
      </Box>

      {/* Loading Overlay */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: "column", gap: 2 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6">Processando imagem...</Typography>
      </Backdrop>
    </PageLayout>
  );
}
