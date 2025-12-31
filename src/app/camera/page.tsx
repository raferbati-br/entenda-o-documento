"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveCapture } from "@/lib/captureStore";
import {
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
} from "@mui/material";

export default function CameraPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const cameraRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function openCamera() {
    cameraRef.current?.click();
  }

  function openFiles() {
    fileRef.current?.click();
  }

  useEffect(() => {
    // Se veio da home pedindo galeria, abre automaticamente
    const source = searchParams.get("source");
    if (source === "gallery") {
      const t = setTimeout(() => openFiles(), 250);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Permite escolher o mesmo arquivo novamente (especialmente no iOS)
    e.currentTarget.value = "";

    // Salva imediatamente o blob para a tela /confirm
    await saveCapture({
      blob: file,
      createdAt: new Date().toISOString(),
    });

    router.push("/confirm");
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Card elevation={2}>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack spacing={1}>
              <Typography variant="h5" fontWeight={900}>
                Tire uma foto do documento
              </Typography>
              <Typography color="text.secondary" variant="body1">
                Pode ser conta, carta, comunicado ou aviso.
              </Typography>
            </Stack>

            <List dense sx={{ bgcolor: "transparent", p: 0 }}>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="• Coloque o documento numa mesa" />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="• Aproxime até as letras ficarem nítidas" />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="• Evite sombras e reflexos (luz da janela ajuda)" />
              </ListItem>
            </List>

            {/* INPUTS ESCONDIDOS */}
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

            <Stack spacing={1.5}>
              <Button variant="contained" size="large" onClick={openCamera} sx={{ py: 1.4 }}>
                📸 Tirar foto agora
              </Button>
              <Button variant="outlined" size="large" onClick={openFiles} sx={{ py: 1.4 }}>
                🖼️ Escolher foto da galeria
              </Button>
            </Stack>

            <Alert severity="info" icon={false}>
              <Typography fontWeight={800}>Dica rápida</Typography>
              <Typography sx={{ mt: 0.5 }}>
                Se o texto estiver pequeno, aproxime mais a câmera e tente manter a mão firme.
              </Typography>
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Privacidade: a foto é usada apenas para gerar a explicação e não é armazenada permanentemente.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
