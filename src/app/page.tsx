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

export default function HomePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Card elevation={2}>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack spacing={1}>
              <Typography variant="h4" fontWeight={900} lineHeight={1.15}>
                Entenda o papel que chegou na sua casa
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tire uma foto do documento e eu explico em português simples.
              </Typography>
            </Stack>

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 2,
              }}
            >
              <Stack spacing={1}>
                <Typography variant="body1">✅ Cartas, cobranças, avisos e comunicados</Typography>
                <Typography variant="body1">✅ Linguagem simples, sem palavras difíceis</Typography>
                <Typography variant="body1">🔒 A foto é usada só para explicar e é apagada em seguida</Typography>
              </Stack>
            </Box>

            <Stack spacing={1.2}>
              <Link href="/camera" style={{ textDecoration: "none" }}>
                <Button variant="contained" size="large" fullWidth sx={{ py: 1.4 }}>
                  📸 Tirar foto do documento
                </Button>
              </Link>

              <Link href="/camera?source=gallery" style={{ textDecoration: "none" }}>
                <Button variant="outlined" size="large" fullWidth sx={{ py: 1.4 }}>
                  🖼️ Escolher foto da galeria
                </Button>
              </Link>
            </Stack>

            <Alert severity="warning" icon={false}>
              <Typography fontWeight={800}>⚠️ Aviso</Typography>
              <Typography sx={{ mt: 0.5 }}>
                Esta explicação é apenas informativa. Ela ajuda a entender o documento, mas não
                substitui orientação de advogado, médico ou servidor público.
              </Typography>
            </Alert>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
