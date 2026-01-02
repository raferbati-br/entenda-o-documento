"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveCapture } from "@/lib/captureStore";

import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Stack,
  Typography,
  AppBar,
  Toolbar,
} from "@mui/material";

import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PhotoRoundedIcon from "@mui/icons-material/PhotoRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import CropFreeRoundedIcon from "@mui/icons-material/CropFreeRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

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
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", bgcolor: "background.default" }}>
      
      {/* 1. Navbar Simples e Nativa */}
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
            {isGalleryFlow ? "Galeria" : "Nova Foto"}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 2. Área de Conteúdo (Instruções) */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", pb: 20 }}>
        <Container maxWidth="sm" sx={{ pt: 3, px: 3 }}>
          
          <Stack spacing={3}>
            {/* Cabeçalho de Texto */}
            <Box>
              <Typography variant="h5" gutterBottom fontWeight={800}>
                {isGalleryFlow ? "Escolha uma foto" : "Vamos preparar a câmera"}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isGalleryFlow
                  ? "Escolha uma imagem nítida onde dê para ler todas as letras."
                  : "Para a inteligência artificial funcionar bem, siga estas dicas rápidas:"}
              </Typography>
            </Box>

            {!isGalleryFlow && (
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
            )}
          </Stack>

        </Container>
      </Box>

      {/* 3. Inputs Escondidos (Lógica mantida) */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onFileChange}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onFileChange}
      />

      {/* 4. Rodapé Fixo (Ação Principal) */}
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
          <Stack spacing={1.5}>
            {/* Botão Principal */}
            {isGalleryFlow ? (
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<PhotoRoundedIcon />}
                onClick={openFiles}
                sx={{ height: 56, fontSize: '1.1rem' }}
              >
                Abrir Galeria
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<CameraAltRoundedIcon />}
                onClick={openCamera}
                sx={{ height: 56, fontSize: '1.1rem' }}
              >
                Abrir Câmera
              </Button>
            )}

            {/* Link Secundário */}
            <Button
              variant="text"
              size="medium"
              color="inherit"
              onClick={() => {
                // Alterna o modo
                const target = isGalleryFlow ? "/camera" : "/camera?source=gallery";
                router.replace(target);
              }}
              sx={{ color: 'text.secondary' }}
            >
              {isGalleryFlow ? "Prefiro usar a câmera" : "Prefiro buscar na galeria"}
            </Button>
          </Stack>
          
          <Typography variant="caption" display="block" textAlign="center" color="text.disabled" sx={{ mt: 2 }}>
            Sua foto é processada com segurança e deletada logo após.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

// Componente visual limpo para as dicas
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