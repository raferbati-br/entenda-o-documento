"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
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
} from "@mui/material";

export default function CameraPage() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function openCamera() {
    cameraRef.current?.click();
  }

  function openFiles() {
    fileRef.current?.click();
  }

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

    // A confirmação passa a existir apenas em /confirm
    router.push("/confirm");
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Card elevation={2}>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack spacing={1}>
              <Typography variant="h5" fontWeight={800}>
                Enviar documento
              </Typography>
              <Typography color="text.secondary">
                Tire uma foto do documento ou escolha uma imagem já salva no seu celular.
              </Typography>
            </Stack>

            <List dense sx={{ bgcolor: "transparent", p: 0 }}>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="• Fotografe o documento inteiro" />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="• Evite sombras e reflexos" />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="• Use um local bem iluminado" />
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
              <Button variant="contained" size="large" onClick={openCamera}>
                📸 Tirar foto
              </Button>
              <Button variant="outlined" size="large" onClick={openFiles}>
                📎 Escolher arquivo
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Dica: se o texto estiver pequeno, aproxime mais a câmera ou escolha uma imagem com melhor qualidade.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
