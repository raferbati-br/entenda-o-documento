"use client";

import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PhotoRoundedIcon from "@mui/icons-material/PhotoRounded";

export default function HomePage() {
  return (
    <Box sx={{ minHeight: "100dvh", px: 2, pt: 2, pb: 2 }}>
      <Stack spacing={2.2}>
        {/* HERO (sem card) */}
        <Stack spacing={1.2}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Chip
              icon={<AutoAwesomeRoundedIcon />}
              label="Português simples"
              size="small"
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
            <Chip
              icon={<LockRoundedIcon />}
              label="Privacidade"
              size="small"
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
          </Stack>

          <Typography variant="h4" fontWeight={950} lineHeight={1.05}>
            Entenda um documento em poucos segundos
          </Typography>

          <Typography color="text.secondary" sx={{ fontSize: 16, lineHeight: 1.4 }}>
            Tire uma foto de um papel (carta, cobrança, aviso) e receba uma explicação clara.
          </Typography>
        </Stack>

        {/* Conteúdo */}
        <Card elevation={2}>
          <CardContent>
            <Stack spacing={2}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  p: 2,
                }}
              >
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1.2} alignItems="flex-start">
                    <DescriptionRoundedIcon sx={{ mt: "2px" }} />
                    <Box>
                      <Typography fontWeight={900}>O que funciona bem</Typography>
                      <Typography color="text.secondary" variant="body2">
                        Cartas, contas, comunicados, avisos e notificações.
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1.2} alignItems="flex-start">
                    <AutoAwesomeRoundedIcon sx={{ mt: "2px" }} />
                    <Box>
                      <Typography fontWeight={900}>Explicação simples</Typography>
                      <Typography color="text.secondary" variant="body2">
                        Sem palavras difíceis e sem dizer o que você “deve fazer”.
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1.2} alignItems="flex-start">
                    <LockRoundedIcon sx={{ mt: "2px" }} />
                    <Box>
                      <Typography fontWeight={900}>Privacidade</Typography>
                      <Typography color="text.secondary" variant="body2">
                        A foto é usada só para gerar a explicação e não é armazenada permanentemente.
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Box>

              {/* CTAs */}
              <Stack spacing={1.2}>
                <Button
                  component={Link}
                  href="/camera"
                  variant="contained"
                  size="large"
                  startIcon={<CameraAltRoundedIcon />}
                  sx={{ py: 1.4, fontWeight: 900 }}
                >
                  Tirar foto do documento
                </Button>

                <Button
                  component={Link}
                  href="/camera?source=gallery"
                  variant="outlined"
                  size="large"
                  startIcon={<PhotoRoundedIcon />}
                  sx={{ py: 1.4, fontWeight: 900 }}
                >
                  Escolher foto da galeria
                </Button>
              </Stack>

              <Alert severity="warning" icon={false}>
                <Typography fontWeight={900}>⚠️ Aviso</Typography>
                <Typography sx={{ mt: 0.5 }}>
                  Esta explicação é apenas informativa e não substitui orientação profissional.
                </Typography>
              </Alert>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
