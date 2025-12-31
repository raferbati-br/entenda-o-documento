import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";

import PremiumHeader from "@/components/PremiumHeader";

import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PhotoRoundedIcon from "@mui/icons-material/PhotoRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";

export default function HomePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <PremiumHeader
        title="Entenda um documento em poucos segundos"
        subtitle="Tire uma foto de um papel (carta, cobrança, aviso) e receba uma explicação clara."
        chips={[
          { icon: <AutoAwesomeRoundedIcon />, label: "Português simples" },
          { icon: <LockRoundedIcon />, label: "Privacidade" },
        ]}
      />

      <Card elevation={2}>
        <CardContent>
          <Stack spacing={2.2}>
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

            <Stack spacing={1.2}>
              <Link href="/camera" style={{ textDecoration: "none" }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<CameraAltRoundedIcon />}
                  sx={{ py: 1.4 }}
                >
                  Tirar foto do documento
                </Button>
              </Link>

              <Link href="/camera?source=gallery" style={{ textDecoration: "none" }}>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<PhotoRoundedIcon />}
                  sx={{ py: 1.4 }}
                >
                  Escolher foto da galeria
                </Button>
              </Link>
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
    </Container>
  );
}
