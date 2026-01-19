"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { saveCapture } from "@/lib/captureStore";
import { telemetryCapture } from "@/lib/telemetry";

import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Typography,
  AppBar,
  Toolbar,
  CircularProgress,
} from "@mui/material";

import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import CropFreeRoundedIcon from "@mui/icons-material/CropFreeRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

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
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", bgcolor: "background.default" }}>
      
      {/* Navbar */}
      <AppBar 
        position="sticky" 
        color="transparent" 
        elevation={0}
        sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => router.back()} sx={{ mr: 1 }}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Nova Foto
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Conteúdo com Scroll */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", pb: 16 }}>
        <Container maxWidth="sm" sx={{ pt: 3, px: 3 }}>
          
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
              <TipItem
                icon={<TextFieldsRoundedIcon color="primary" />}
                title="Letras Nítidas"
                subtitle="Aproxime até conseguir ler o texto na tela."
              />
              <TipItem
                icon={<LightModeRoundedIcon color="warning" />}
                title="Boa Iluminação"
                subtitle="Evite sombras. A luz natural ajuda muito."
              />
              <TipItem
                icon={<CropFreeRoundedIcon color="action" />}
                title="Enquadramento"
                subtitle="Tente pegar o documento inteiro."
              />

              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 3, 
                  border: '1px solid', 
                  borderColor: 'info.main', 
                  bgcolor: 'rgba(2, 136, 209, 0.05)' 
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Dica: Mantenha a mão firme ao clicar.
                </Typography>
              </Alert>
            </Stack>
          </Stack>

        </Container>
      </Box>

      {/* Inputs Escondidos */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onFileChange} />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />

      {/* RODAPÉ DUPLO */}
      <Box 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          p: 2, 
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 10
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <Stack direction="row" spacing={2}>
            
            {/* Botão Galeria (Caso a pessoa mude de ideia aqui dentro) */}
            <Button
              variant="outlined" 
              size="large"
              fullWidth
              startIcon={<PhotoLibraryRoundedIcon />}
              onClick={openFiles}
              sx={{ flex: 1, height: 56, fontWeight: 700, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
            >
              Galeria
            </Button>

            {/* Botão Câmera (Destaque principal) */}
            <Button
              variant="contained" 
              size="large"
              fullWidth
              startIcon={<CameraAltRoundedIcon />}
              onClick={openCamera}
              sx={{ flex: 1, height: 56, fontWeight: 700 }}
            >
              Câmera
            </Button>

          </Stack>
          
          <Typography variant="caption" display="block" textAlign="center" color="text.disabled" sx={{ mt: 2 }}>
            Sua foto é segura e deletada após o uso.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

function TipItem({ icon, title, subtitle }: { icon: any, title: string, subtitle: string }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box 
        sx={{ 
          width: 48, 
          height: 48, 
          borderRadius: '50%', 
          bgcolor: 'action.hover', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  )
}

export default function CameraPage() {
  return (
    <Suspense fallback={<Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}>
      <CameraContent />
    </Suspense>
  );
}
