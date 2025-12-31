"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveCapture } from "@/lib/captureStore";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Typography,
  Chip,
} from "@mui/material";

import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PhotoRoundedIcon from "@mui/icons-material/PhotoRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import CropFreeRoundedIcon from "@mui/icons-material/CropFreeRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import PremiumHeader from "@/components/PremiumHeader";

export default function CameraPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const cameraRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const source = useMemo(() => searchParams.get("source"), [searchParams]);
  const isGalleryFlow = source === "gallery";

  const [autoOpened, setAutoOpened] = useState(false);

  function openCamera() {
    cameraRef.current?.click();
  }

  function openFiles() {
    fileRef.current?.click();
  }

  useEffect(() => {
    if (isGalleryFlow && !autoOpened) {
      setAutoOpened(true);
      const t = setTimeout(() => openFiles(), 200);
      return () => clearTimeout(t);
    }
  }, [isGalleryFlow, autoOpened]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    e.currentTarget.value = "";

    await saveCapture({
      blob: file,
      createdAt: new Date().toISOString(),
    });

    router.push("/confirm");
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <PremiumHeader
        title={isGalleryFlow ? "Escolha uma foto do documento" : "Tire uma foto do documento"}
        subtitle={
          isGalleryFlow
            ? "Escolha uma foto nítida, com boa luz, onde dê para ver as letras."
            : "Uma foto bem clara melhora muito a explicação."
        }
        chips={[
          { icon: <AutoAwesomeRoundedIcon />, label: "Foto do documento" },
          { icon: <LockRoundedIcon />, label: "Privacidade" },
        ]}
      />

      <Card elevation={2}>
        <CardContent>
          <Stack spacing={2.2}>
            {!isGalleryFlow && (
              <Stack spacing={1.2}>
                <TipRow
                  icon={<TextFieldsRoundedIcon />}
                  title="Deixe as letras nítidas"
                  subtitle="Aproxime a câmera até o texto ficar legível."
                />
                <TipRow
                  icon={<LightModeRoundedIcon />}
                  title="Use boa luz"
                  subtitle="Evite sombra e reflexo. Luz da janela ajuda."
                />
                <TipRow
                  icon={<CropFreeRoundedIcon />}
                  title="Enquadre o documento"
                  subtitle="Tente mostrar o documento inteiro."
                />

                <Alert severity="info" icon={false} sx={{ mt: 0.5 }}>
                  <Typography fontWeight={900}>Dica rápida</Typography>
                  <Typography sx={{ mt: 0.5 }}>
                    Se o texto estiver pequeno, aproxime mais e mantenha a mão firme.
                  </Typography>
                </Alert>
              </Stack>
            )}

            {/* INPUTS */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={onFileChange}
            />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />

            <Stack spacing={1.2}>
              {isGalleryFlow ? (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PhotoRoundedIcon />}
                  onClick={openFiles}
                >
                  Escolher uma foto
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CameraAltRoundedIcon />}
                  onClick={openCamera}
                >
                  Tirar foto agora
                </Button>
              )}

              <Divider />

              {isGalleryFlow ? (
                <Button variant="text" size="large" onClick={() => router.push("/camera")}>
                  📸 Prefiro tirar foto com a câmera
                </Button>
              ) : (
                <Button
                  variant="text"
                  size="large"
                  onClick={() => router.push("/camera?source=gallery")}
                >
                  🖼️ Prefiro escolher da galeria
                </Button>
              )}

              <Button variant="text" size="large" onClick={() => router.push("/")}>
                Voltar ao início
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Privacidade: a foto é usada apenas para gerar a explicação e não é armazenada permanentemente.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

function TipRow({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        p: 1.6,
        bgcolor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={1.4} alignItems="flex-start">
        <Box sx={{ mt: "2px" }}>{icon}</Box>
        <Box>
          <Typography fontWeight={900}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
