"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveCapture } from "@/lib/captureStore";
import { telemetryCapture } from "@/lib/telemetry";

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
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    telemetryCapture("home_open");
  }, []);

  // Função que abre a galeria nativa direto na Home
  const handleOpenGallery = () => {
    telemetryCapture("gallery_open", { source: "home" });
    galleryInputRef.current?.click();
  };

  // Quando o usuário escolhe a foto, salvamos e vamos direto para o Confirm
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limpa o valor para permitir selecionar o mesmo arquivo se quiser
    e.currentTarget.value = "";

    await saveCapture({
      blob: file,
      createdAt: new Date().toISOString(),
    });

    telemetryCapture("gallery_selected", { source: "home" });
    router.push("/confirm");
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
              label: "Galeria",
              startIcon: <PhotoLibraryRoundedIcon />,
              onClick: handleOpenGallery,
            }}
            primary={{
              label: "Tirar foto",
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
            Entenda qualquer documento num piscar de olhos
          </Typography>
          <Typography color="text.secondary" variant="body1" sx={{ lineHeight: 1.6 }}>
            Envie uma imagem de um documento e receba uma explicação direta ao ponto.
          </Typography>

        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Lista de Benefícios */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          O que funciona bem?
        </Typography>

        <Stack spacing={2}>
          <IconTextRow
            icon={<DescriptionRoundedIcon fontSize="inherit" />}
            iconColor="primary.main"
            title="Documentos Burocráticos"
            description="Cartas judiciais, contas, comunicados e avisos."
          />
          <IconTextRow
            icon={<AutoAwesomeRoundedIcon fontSize="inherit" />}
            iconColor="warning.main"
            title="Explicação Simples"
            description="Traduzimos o 'juridiquês' para o português do dia a dia."
          />
          <IconTextRow
            icon={<LockRoundedIcon fontSize="inherit" />}
            iconColor="text.secondary"
            title="Privacidade Total"
            description="Sua foto é processada e deletada. Nada fica salvo."
          />
        </Stack>

        <Box sx={{ height: 8 }} />
      </PageLayout>
    </>
  );
}

