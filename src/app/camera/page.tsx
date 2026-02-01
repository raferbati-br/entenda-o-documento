"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { telemetryCapture } from "@/lib/telemetry";
import { useCaptureInput } from "@/lib/hooks/useCaptureInput";
import { UI_TEXTS } from "@/lib/constants";

import { Box, Stack, Typography, CircularProgress } from "@mui/material";

import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import CropFreeRoundedIcon from "@mui/icons-material/CropFreeRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import IconTextRow from "../_components/IconTextRow";
import FooterActions from "../_components/FooterActions";
import BackHeader from "../_components/BackHeader";
import PageLayout from "../_components/PageLayout";
import Notice from "../_components/Notice";

function CameraContent() {
  const router = useRouter();
  const { cameraInputRef, galleryInputRef, openCamera, openGallery, onFileChange } = useCaptureInput({
    onSaved: () => router.push("/confirm"),
    telemetry: {
      openCamera: { name: "camera_open_capture" },
      openGallery: { name: "gallery_open", data: { source: "camera" } },
      selected: { name: "gallery_selected", data: { source: "camera" } },
    },
  });

  useEffect(() => {
    telemetryCapture("camera_open");
  }, []);

  return (
    <>
      <PageLayout
        header={
          <BackHeader onBack={() => router.back()} title="Nova Foto" />
        }
        footer={
          <FooterActions
            secondary={{
              label: "Galeria",
              startIcon: <PhotoLibraryRoundedIcon />,
              onClick: openGallery,
            }}
            primary={{
              label: "Tirar foto",
              startIcon: <CameraAltRoundedIcon />,
              onClick: openCamera,
            }}
          />
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
              description={UI_TEXTS.CAMERA_HINT}
            />

            <Notice severity="info" title="Dica" density="compact">
              Mantenha a mão firme ao clicar.
            </Notice>
          </Stack>
        </Stack>
      </PageLayout>

      {/* Inputs Escondidos */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={onFileChange} />
      <input ref={galleryInputRef} type="file" accept="image/*" hidden onChange={onFileChange} />

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
