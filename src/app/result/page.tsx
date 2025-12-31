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

function confidenceToInfo(confidence: number) {
  if (confidence < 0.45) return { label: "Baixa", color: "warning" as const, emoji: "⚠️" };
  if (confidence < 0.75) return { label: "Média", color: "info" as const, emoji: "🟦" };
  return { label: "Alta", color: "success" as const, emoji: "✅" };
}

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
  const confidenceInfo = useMemo(() => confidenceToInfo(confidence), [confidence]);

  if (!result) return null;

  const showLowConfidenceHelp = confidence < 0.45;

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Stack spacing={2.5}>
        <Card elevation={2}>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="h5" fontWeight={800}>
                Explicação do documento
              </Typography>
              <Typography color="text.secondary" variant="body1">
                Em português simples.
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Chip
                  size="small"
                  label={`${confidenceInfo.emoji} Confiança: ${confidenceInfo.label}`}
                  color={confidenceInfo.color}
                />
                <Typography variant="body2" color="text.secondary">
                  {confidenceInfo.label === "Baixa"
                    ? "A foto parece difícil de ler."
                    : confidenceInfo.label === "Média"
                    ? "Algumas partes podem estar pouco nítidas."
                    : "A maioria do texto está legível."}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {showLowConfidenceHelp && (
          <Card elevation={1}>
            <CardContent>
              <Stack spacing={1.2}>
                <Typography variant="h6" fontWeight={800}>
                  Vamos melhorar a foto?
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Com uma foto mais clara, a explicação fica bem melhor.
                </Typography>

                <Box sx={{ pl: 1 }}>
                  <Typography variant="body1">• Coloque o papel numa mesa</Typography>
                  <Typography variant="body1">• Aproxime até as letras ficarem nítidas</Typography>
                  <Typography variant="body1">• Evite sombra e reflexo</Typography>
                </Box>

                <Button variant="contained" size="large" sx={{ py: 1.4 }} onClick={newDoc}>
                  📸 Tirar outra foto
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {renderCard(cardMap["whatIs"])}
        {renderCard(cardMap["whatSays"])}
        {renderCard(cardMap["dates"])}
        {renderCard(cardMap["terms"])}
        {renderCard(cardMap["whatUsuallyHappens"])}

        <Alert severity="warning" icon={false}>
          <Typography fontWeight={800}>⚠️ Aviso</Typography>
          <Typography sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>{result.notice}</Typography>
        </Alert>

        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
            Esta explicação é apenas informativa: ajuda a entender o documento.
            {"\n"}
            Ela não substitui orientação de advogado, médico ou servidor público.
          </Typography>
        </Box>

        <Divider />

        <Stack spacing={1.5}>
          <Button variant="contained" size="large" onClick={newDoc} sx={{ py: 1.4 }}>
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
        <Typography variant="body1" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
          {card.text}
        </Typography>
      </CardContent>
    </Card>
  );
}
