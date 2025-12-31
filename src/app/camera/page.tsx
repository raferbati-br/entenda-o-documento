"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Divider,
} from "@mui/material";

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
    // Se veio da home pedindo galeria, abre automaticamente (uma vez)
    if (isGalleryFlow && !autoOpened) {
      setAutoOpened(true);
      const t = setTimeout(() => openFiles(), 200);
      return () => clearTimeout(t);
    }
  }, [isGalleryFlow, autoOpened]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Permite escolher o mesmo arquivo novamente (especialmente no iOS)
    e.currentTarget.value = "";

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
                {isGalleryFlow ? "Escolha uma foto do documento" : "Tire uma foto do documento"}
              </Typography>
              <Typography color="text.secondary" variant="body1">
                {isGalleryFlow
                  ? "Escolha uma foto nítida, com boa luz, onde dê para ver as letras."
                  : "Pode ser conta, carta, comunicado ou aviso."}
              </Typography>
            </Stack>

            {!isGalleryFlow && (
              <>
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

                <Alert severity="info" icon={false}>
                  <Typography fontWeight={800}>Dica rápida</Typography>
                  <Typography sx={{ mt: 0.5 }}>
                    Se o texto estiver pequeno, aproxime mais a câmera e tente manter a mão firme.
                  </Typography>
                </Alert>
              </>
            )}

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

            {/* CTA principal (evita duplicar a escolha que já existe na home) */}
            <Stack spacing={1.2}>
              {isGalleryFlow ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={openFiles}
                  sx={{ py: 1.4 }}
                >
                  🖼️ Escolher uma foto
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  onClick={openCamera}
                  sx={{ py: 1.4 }}
                >
                  📸 Tirar foto agora
                </Button>
              )}

              <Divider />

              {/* Plano B discreto, sem competir com a ação principal */}
              {isGalleryFlow ? (
                <Button
                  variant="text"
                  size="large"
                  onClick={() => router.push("/camera")}
                >
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
