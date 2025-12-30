"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearCaptureId } from "@/lib/captureIdStore";
import { clearResult, loadResult, AnalysisResult } from "@/lib/resultStore";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

type CardT = {
  id: string;
  title: string;
  text: string;
};

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const res = loadResult();
    if (!res) {
      router.replace("/");
      return;
    }
    setResult(res);
  }, [router]);

  function newDoc() {
    clearResult();
    clearCaptureId();
    router.push("/camera");
  }

  const cardMap = useMemo(() => {
    if (!result?.cards) return {} as Record<string, CardT>;
    return Object.fromEntries((result.cards as CardT[]).map((c) => [c.id, c]));
  }, [result]);

  const confidence = result?.confidence ?? 0;

  const confidenceInfo = useMemo(() => {
    if (confidence < 0.45) return { label: "Baixa", color: "warning" as const };
    if (confidence < 0.75) return { label: "Média", color: "info" as const };
    return { label: "Alta", color: "success" as const };
  }, [confidence]);

  if (!result) return null;

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Stack spacing={2.5}>
        <Card elevation={2}>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="h5" fontWeight={800}>
                Explicação do documento
              </Typography>
              <Typography color="text.secondary">Em português simples.</Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label={`Confiança: ${confidenceInfo.label}`} color={confidenceInfo.color} />
                <Typography variant="caption" color="text.secondary">
                  ({Math.round(confidence * 100)}%)
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {renderCard(cardMap["whatIs"])}
        {renderCard(cardMap["whatSays"])}
        {renderCard(cardMap["dates"])}
        {renderCard(cardMap["terms"])}
        {renderCard(cardMap["whatUsuallyHappens"])}

        <Alert severity="warning" icon={false}>
          <Typography fontWeight={700}>⚠️ Aviso importante</Typography>
          <Typography sx={{ mt: 0.5 }}>{result.notice}</Typography>
        </Alert>

        <Box>
          <Typography variant="body2" color="text.secondary">
            <strong>Aviso importante:</strong> esta ferramenta ajuda a entender documentos.
            Ela não substitui advogado, médico ou servidor público.
          </Typography>
        </Box>

        <Divider />

        <Stack spacing={1.5}>
          <Button variant="contained" size="large" onClick={newDoc}>
            📸 Analisar outro documento
          </Button>

          <Button component={Link} href="/" variant="text" size="large">
            Voltar ao início
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}

function renderCard(card?: { title: string; text: string }) {
  if (!card || !card.text) return null;

  return (
    <Card elevation={1}>
      <CardContent>
        <Typography variant="h6" fontWeight={800}>
          {card.title}
        </Typography>
        <Typography sx={{ mt: 1, whiteSpace: "pre-wrap" }}>{card.text}</Typography>
      </CardContent>
    </Card>
  );
}
