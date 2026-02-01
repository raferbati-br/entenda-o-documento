"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { saveCaptureId } from "@/lib/captureIdStore";
import { loadCapture, clearCapture } from "@/lib/captureStore";
import { compressBlobToDataUrl } from "@/lib/imageCompression";
import { postJsonWithSession } from "@/lib/apiClient";
import { recordLatencyStep, startLatencyTrace } from "@/lib/latencyTrace";
import { telemetryCapture } from "@/lib/telemetry";
import { mapCaptureError, mapNetworkError } from "@/lib/errorMesages";
import { useCaptureObjectUrl } from "@/lib/hooks/useCaptureObjectUrl";
import { UI_TEXTS } from "@/lib/constants";

import { CircularProgress, Typography, Backdrop } from "@mui/material";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import FooterActions from "../_components/FooterActions";
import BackHeader from "../_components/BackHeader";
import PageLayout from "../_components/PageLayout";
import Notice from "../_components/Notice";
import PinchZoomImage from "../_components/PinchZoomImage";

export default function ConfirmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const handleMissingCapture = useCallback(() => {
    router.replace("/camera");
  }, [router]);
  const { url: previewUrl } = useCaptureObjectUrl({ onMissing: handleMissingCapture });


  useEffect(() => {
    telemetryCapture("confirm_open");
  }, []);

  const retake = useCallback(async () => {
    await clearCapture();
    telemetryCapture("confirm_retake");
    router.replace("/camera");
  }, [router]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    setErr(null);
    telemetryCapture("confirm_submit");
    startLatencyTrace();

    try {
      const payload = await loadCapture();
      if (!payload?.blob) {
        router.replace("/camera");
        return;
      }

      // 1) Lógica de Compressão (Mantida do seu arquivo original)
      const compressStart = performance.now();
      let mainImage = await compressBlobToDataUrl(payload.blob, {
        maxDimension: 1600,
        quality: 0.78,
        mimeType: "image/jpeg",
      });

      if (mainImage.bytes > 1_700_000) {
        mainImage = await compressBlobToDataUrl(payload.blob, {
          maxDimension: 1400,
          quality: 0.72,
          mimeType: "image/jpeg",
        });
      }
      recordLatencyStep("compress_ms", performance.now() - compressStart);

      const ocrMaxDimension = 1200;
      let ocrDataUrl = "";
      if (Math.max(mainImage.width, mainImage.height) > ocrMaxDimension) {
        const ocrStart = performance.now();
        const ocrImage = await compressBlobToDataUrl(payload.blob, {
          maxDimension: ocrMaxDimension,
          quality: 0.7,
          mimeType: "image/jpeg",
        });
        recordLatencyStep("compress_ocr_ms", performance.now() - ocrStart);
        ocrDataUrl = ocrImage.dataUrl;
      }

      // 2) Envio para API
      const captureStart = performance.now();
      const { res, data } = await postJsonWithSession<{
        ok?: boolean;
        captureId?: string;
        error?: string;
      }>("/api/capture", {
        imageBase64: mainImage.dataUrl,
        ...(ocrDataUrl ? { ocrImageBase64: ocrDataUrl } : {}),
      });
      recordLatencyStep("capture_ms", performance.now() - captureStart);
      if (!res.ok || !data?.ok) {
        const apiError = typeof data?.error === "string" ? data.error : "";
        throw new Error(mapCaptureError(res.status, apiError));
      }

      if (typeof data.captureId !== "string" || !data.captureId) {
        throw new Error("Resposta invalida.");
      }

      saveCaptureId(data.captureId);
      router.push("/analyzing");

    } catch (e: unknown) {
      setLoading(false);
      const message = e instanceof Error ? e.message : "";
      setErr(mapNetworkError(message));
      telemetryCapture("confirm_error");
    }
  }, [router]);

  const handleRetakeClick = useCallback(() => {
    void retake();
  }, [retake]);

  const handleConfirmClick = useCallback(() => {
    void handleConfirm();
  }, [handleConfirm]);

  if (!previewUrl) return null;

  return (
    <PageLayout
      background="#000"
      contentPaddingTop={0}
      contentPaddingBottom={0}
      contentPaddingX={0}
      disableContainer
      header={
        <BackHeader
          onBack={retake}
          headerSx={{ borderBottom: "none", bgcolor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          iconButtonSx={{ color: "white" }}
          title={
            <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
              {UI_TEXTS.CHECK_IMAGE_TITLE}
            </Typography>
          }
        />
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
            label: UI_TEXTS.CHOOSE_ANOTHER,
            startIcon: <ReplayRoundedIcon />,
            onClick: handleRetakeClick,
            disabled: loading,
          }}
          primary={{
            label: UI_TEXTS.USE_THIS,
            startIcon: <CheckCircleRoundedIcon />,
            onClick: handleConfirmClick,
            disabled: loading,
          }}
        />
      }
    >
      <PinchZoomImage key={previewUrl ?? "empty"} src={previewUrl} alt="Captura" minZoom={1} maxZoom={3} />
      {/* Loading Overlay */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: "column", gap: 2 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6">{UI_TEXTS.PROCESSING_IMAGE}</Typography>
      </Backdrop>
    </PageLayout>
  );
}
