"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { telemetryCapture } from "@/lib/telemetry";
import { useCaptureInput } from "@/lib/hooks/useCaptureInput";
import { UI_TEXTS } from "@/lib/constants";

import { Box, Divider, Stack, Typography } from "@mui/material";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import IconTextRow from "./_components/IconTextRow";
import FooterActions from "./_components/FooterActions";
import PageLayout from "./_components/PageLayout";

export default function HomePage() {
  const router = useRouter();
  const { galleryInputRef, openGallery, onFileChange } = useCaptureInput({
    onSaved: () => router.push("/confirm"),
    telemetry: {
      openGallery: { name: "gallery_open", data: { source: "home" } },
      selected: { name: "gallery_selected", data: { source: "home" } },
    },
  });

  useEffect(() => {
    telemetryCapture("home_open");
  }, []);

  const handleOpenGallery = () => {
    openGallery();
  };


  return (
    <>
      {/* Input Oculto para Galeria */}
      <input ref={galleryInputRef} type="file" accept="image/*" hidden onChange={onFileChange} />

      <PageLayout
        contentPaddingTop={4}
        footer={
          <FooterActions
            secondary={{
              label: UI_TEXTS.GALLERY_BUTTON,
              startIcon: <PhotoLibraryRoundedIcon />,
              onClick: handleOpenGallery,
            }}
            primary={{
              label: UI_TEXTS.TAKE_PHOTO_BUTTON,
              startIcon: <CameraAltRoundedIcon />,
              component: Link,
              href: "/camera",
              onClick: () => telemetryCapture("camera_start", { source: "home" }),
            }}
          />
        }
      >
        {/* HERO */}
        <Stack spacing={2} sx={{ mb: 2 }}>

          <Typography variant="h4" gutterBottom fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
            {UI_TEXTS.HOME_TITLE}
          </Typography>
          <Typography color="text.secondary" variant="body1" sx={{ lineHeight: 1.6 }}>
            {UI_TEXTS.HOME_SUBTITLE}
          </Typography>

        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Lista de Benefícios */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          {UI_TEXTS.HOME_BENEFITS_TITLE}
        </Typography>

        <Stack spacing={2}>
          <IconTextRow
            icon={<DescriptionRoundedIcon fontSize="inherit" />}
            iconColor="primary.main"
            title={UI_TEXTS.DOCUMENTS_TITLE}
            description={UI_TEXTS.HOME_DOCUMENTS_DESCRIPTION}
          />
          <IconTextRow
            icon={<AutoAwesomeRoundedIcon fontSize="inherit" />}
            iconColor="warning.main"
            title={UI_TEXTS.HOME_SIMPLE_EXPLANATION_TITLE}
            description={UI_TEXTS.HOME_SIMPLE_EXPLANATION_DESCRIPTION}
          />
          <IconTextRow
            icon={<LockRoundedIcon fontSize="inherit" />}
            iconColor="text.secondary"
            title={UI_TEXTS.HOME_PRIVACY_TITLE}
            description={UI_TEXTS.HOME_PRIVACY_DESCRIPTION}
          />
        </Stack>

        <Box sx={{ height: 8 }} />
      </PageLayout>
    </>
  );
}

