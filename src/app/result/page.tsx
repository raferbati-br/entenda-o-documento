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

function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Web Speech state
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  useEffect(() => {
    const res = loadResult();
    if (!res) {
      router.replace("/");
      return;
    }
    setResult(res);
  }, [router]);

  useEffect(() => {
    setTtsSupported(isSpeechSupported());

    // Se o usuário sair da página, para de falar
    return () => {
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // ignore
      }
    };
  }, []);

  function newDoc() {
    // garante que para a fala ao trocar de tela
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // ignore
    }

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

  const showLowConfidenceHelp = confidence < 0.45;

  const speakText = useMemo(() => {
    if (!result) return "";
    const parts = [
      "Explicação do documento.",
      cardMap["whatIs"]?.title ? `${cardMap["whatIs"]?.title}. ${cardMap["whatIs"]?.text}` : "",
      cardMap["whatSays"]?.title ? `${cardMap["whatSays"]?.title}. ${cardMap["whatSays"]?.text}` : "",
      cardMap["dates"]?.title ? `${cardMap["dates"]?.title}. ${cardMap["dates"]?.text}` : "",
      cardMap["terms"]?.title ? `${cardMap["terms"]?.title}. ${cardMap["terms"]?.text}` : "",
      cardMap["whatUsuallyHappens"]?.title
        ? `${cardMap["whatUsuallyHappens"]?.title}. ${cardMap["whatUsuallyHappens"]?.text}`
        : "",
      result.notice ? `Aviso. ${result.notice}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    return parts;
  }, [result, cardMap]);

  function stopSpeaking() {
    setTtsError(null);
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    } finally {
      setIsSpeaking(false);
    }
  }

  function startSpeaking() {
    setTtsError(null);

    if (!ttsSupported) {
      setTtsError("Seu navegador não suporta leitura em voz alta.");
      return;
    }

    try {
      // Se já estiver falando alguma coisa, cancela e recomeça
      window.speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(speakText);
      u.lang = "pt-BR";
      u.rate = 0.95; // um pouco mais lento (melhor para idosos)
      u.pitch = 1.0;

      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => {
        setIsSpeaking(false);
        setTtsError("Não consegui ler em voz alta agora. Tente novamente.");
      };

      window.speechSynthesis.speak(u);
    } catch (e) {
      setIsSpeaking(false);
      setTtsError("Não consegui iniciar a leitura em voz alta.");
    }
  }

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

        {/* TTS (Web Speech API) */}
        <Card elevation={1}>
          <CardContent>
            <Stack spacing={1.2}>
              <Typography variant="h6" fontWeight={800}>
                Ouvir a explicação
              </Typography>
              <Typography variant="body1" color="text.secondary">
                A leitura é feita pela voz do seu celular/navegador. Não usa OpenAI.
              </Typography>

              {ttsError && (
                <Alert severity="warning" icon={false}>
                  <Typography fontWeight={800}>Atenção</Typography>
                  <Typography sx={{ mt: 0.5 }}>{ttsError}</Typography>
                </Alert>
              )}

              {!ttsSupported ? (
                <Alert severity="info" icon={false}>
                  <Typography fontWeight={800}>Leitura em voz alta indisponível</Typography>
                  <Typography sx={{ mt: 0.5 }}>
                    Seu navegador pode não suportar esta função. Você ainda pode ler a explicação abaixo.
                  </Typography>
                </Alert>
              ) : (
                <Button
                  variant={isSpeaking ? "outlined" : "contained"}
                  size="large"
                  sx={{ py: 1.4 }}
                  onClick={() => (isSpeaking ? stopSpeaking() : startSpeaking())}
                >
                  {isSpeaking ? "⏹️ Parar leitura" : "🔊 Ouvir explicação"}
                </Button>
              )}
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
          <Button
            variant="contained"
            size="large"
            onClick={() => {
              stopSpeaking();
              newDoc();
            }}
            sx={{ py: 1.4 }}
          >
            📸 Analisar outro documento
          </Button>

          <Button
            component={Link}
            href="/"
            variant="text"
            size="large"
            onClick={() => stopSpeaking()}
          >
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
