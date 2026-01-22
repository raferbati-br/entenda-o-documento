"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { saveCapture } from "@/lib/captureStore";
import { telemetryCapture } from "@/lib/telemetry";

import { Box, Button, IconButton, Stack, Typography, CircularProgress } from "@mui/material";

import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import CropFreeRoundedIcon from "@mui/icons-material/CropFreeRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import IconTextRow from "../_components/IconTextRow";
import ActionBar from "../_components/ActionBar";
import PageHeader from "../_components/PageHeader";
import PageLayout from "../_components/PageLayout";
import Notice from "../_components/Notice";

function CameraContent() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    telemetryCapture("camera_open");
  }, []);

  function openCamera() {
    telemetryCapture("camera_open_capture");
    cameraRef.current?.click();
  }

  function openFiles() {
    telemetryCapture("gallery_open", { source: "camera" });
    fileRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    e.currentTarget.value = "";

    await saveCapture({
      blob: file,
      createdAt: new Date().toISOString(),
    });

    telemetryCapture("gallery_selected", { source: "camera" });
    router.push("/confirm");
  }

  return (
    <>
      <PageLayout
        header={
          <PageHeader>
            <IconButton edge="start" onClick={() => router.back()} sx={{ mr: 1 }}>
              <ArrowBackRoundedIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              Nova Foto
            </Typography>
          </PageHeader>
        }
        footer={
          <ActionBar>
            <Stack direction="row" spacing={2}>
              {/* Botão Galeria (Caso a pessoa mude de ideia aqui dentro) */}
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<PhotoLibraryRoundedIcon />}
                onClick={openFiles}
                sx={{ flex: 1, height: 56, fontWeight: 700, borderWidth: 2, "&:hover": { borderWidth: 2 } }}
              >
                Galeria
              </Button>

              {/* Botão principal */}
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<CameraAltRoundedIcon />}
                onClick={openCamera}
                sx={{ flex: 1, height: 56, fontWeight: 700 }}
              >
                Tirar foto
              </Button>
            </Stack>

            <Typography variant="caption" display="block" textAlign="center" color="text.disabled" sx={{ mt: 2 }}>
              Sua foto é segura e deletada após o uso.
            </Typography>
          </ActionBar>
        }
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" gutterBottom fontWeight={800}>
              Vamos preparar a câmera
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Para a inteligência artificial funcionar bem, siga estas dicas rápidas:
            </Typography>
          </Box>

          <Stack spacing={2}>
            <IconTextRow
              icon={<TextFieldsRoundedIcon fontSize="inherit" />}
              iconColor="primary.main"
              title="Letras Nítidas"
              description="Aproxime até conseguir ler o texto na tela."
            />
            <IconTextRow
              icon={<LightModeRoundedIcon fontSize="inherit" />}
              iconColor="warning.main"
              title="Boa Iluminação"
              description="Evite sombras. A luz natural ajuda muito."
            />
            <IconTextRow
              icon={<CropFreeRoundedIcon fontSize="inherit" />}
              iconColor="text.secondary"
              title="Enquadramento"
              description="Tente pegar o documento inteiro."
            />

            <Notice severity="info" title="Dica">
              Mantenha a mão firme ao clicar.
            </Notice>
          </Stack>
        </Stack>
      </PageLayout>

      {/* Inputs Escondidos */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onFileChange} />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />

    </>
  );
}

export default function CameraPage() {
  return (
    <Suspense fallback={<Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}>
      <CameraContent />
    </Suspense>
  );
}
