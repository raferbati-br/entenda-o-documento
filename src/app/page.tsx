import Link from "next/link";
import { Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";

export default function HomePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Card elevation={2}>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack spacing={1}>
              <Typography variant="h4" fontWeight={800} lineHeight={1.15}>
                Entenda o papel que chegou na sua casa
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tire uma foto do documento e eu explico em português simples.
              </Typography>
            </Stack>

            <Link href="/camera" style={{ textDecoration: "none" }}>
              <Button variant="contained" size="large" fullWidth>
                Tirar foto do documento
              </Button>
            </Link>

            <Typography variant="body2" color="text.secondary">
              <strong>Aviso importante:</strong> esta ferramenta ajuda a entender documentos.
              Ela não substitui advogado, médico ou servidor público.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
