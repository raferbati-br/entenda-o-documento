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
          <BackHeader onBack={() => router.back()} title={UI_TEXTS.NEW_PHOTO_TITLE} />
        }
        footer={
          <FooterActions
            secondary={{
              label: UI_TEXTS.GALLERY_BUTTON,
              startIcon: <PhotoLibraryRoundedIcon />,
              onClick: openGallery,
            }}
            primary={{
              label: UI_TEXTS.TAKE_PHOTO_BUTTON,
              startIcon: <CameraAltRoundedIcon />,
              onClick: openCamera,
            }}
          />
        }
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" gutterBottom fontWeight={800}>
              {UI_TEXTS.CAMERA_PREP_TITLE}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {UI_TEXTS.CAMERA_PREP_SUBTITLE}
            </Typography>
          </Box>

          <Stack spacing={2}>
            <IconTextRow
              icon={<TextFieldsRoundedIcon fontSize="inherit" />}
              iconColor="primary.main"
              title={UI_TEXTS.CAMERA_TIP_CLEAR_TEXT}
              description={UI_TEXTS.CAMERA_TIP_CLEAR_TEXT_DESCRIPTION}
            />
            <IconTextRow
              icon={<LightModeRoundedIcon fontSize="inherit" />}
              iconColor="warning.main"
              title={UI_TEXTS.CAMERA_TIP_GOOD_LIGHT}
              description={UI_TEXTS.CAMERA_TIP_GOOD_LIGHT_DESCRIPTION}
            />
            <IconTextRow
              icon={<CropFreeRoundedIcon fontSize="inherit" />}
              iconColor="text.secondary"
              title={UI_TEXTS.CAMERA_TIP_FRAMING}
              description={UI_TEXTS.CAMERA_HINT}
            />

            <Notice severity="info" title={UI_TEXTS.CAMERA_TIP_TITLE} density="compact">
              {UI_TEXTS.CAMERA_TIP_DESCRIPTION}
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
