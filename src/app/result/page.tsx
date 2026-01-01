"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { clearCaptureId } from "@/lib/captureIdStore";
import { clearResult, loadResult, AnalysisResult } from "@/lib/resultStore";

import Screen from "@/components/Screen";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";

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
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

function SectionCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text?: string;
}) {
  if (!text) return null;

  return (
    <Card elevation={1}>
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            {icon}
            <Typography variant="h6" fontWeight={900}>
              {title}
            </Typography>
          </Stack>

          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {text}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ResultPage() {
  const router = useRouter();

  const [result, setResult] = useState<AnalysisResult | null>(null);

  // TTS
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  // ✅ Hooks sempre rodam
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
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  const cardsArr = useMemo<CardT[]>(() => {
    return (result?.cards as CardT[]) || [];
  }, [result]);

  const cardMap = useMemo<Record<string, CardT>>(() => {
    return Object.fromEntries(cardsArr.map((c) => [c.id, c]));
  }, [cardsArr]);

  const confidence = result?.confidence ?? 0;

  const confidenceInfo = useMemo(() => confidenceToInfo(confidence), [confidence]);
  const showLowConfidenceHelp = confidence < 0.45;

  const confidenceSubtitle = useMemo(() => {
    if (confidenceInfo.label === "Baixa") return "A foto parece difícil de ler.";
    if (confidenceInfo.label === "Média") return "Algumas partes podem estar pouco nítidas.";
    return "A maioria do texto está legível.";
  }, [confidenceInfo.label]);

  // ✅ speakText é hook, então precisa existir mesmo quando result é null
  const speakText = useMemo(() => {
    const notice = result?.notice || "";
    const parts = [
      "Explicação do documento.",
      cardMap["whatIs"]?.title ? `${cardMap["whatIs"]?.title}. ${cardMap["whatIs"]?.text}` : "",
      cardMap["whatSays"]?.title
        ? `${cardMap["whatSays"]?.title}. ${cardMap["whatSays"]?.text}`
        : "",
      cardMap["dates"]?.title ? `${cardMap["dates"]?.title}. ${cardMap["dates"]?.text}` : "",
      cardMap["terms"]?.title ? `${cardMap["terms"]?.title}. ${cardMap["terms"]?.text}` : "",
      cardMap["whatUsuallyHappens"]?.title
        ? `${cardMap["whatUsuallyHappens"]?.title}. ${cardMap["whatUsuallyHappens"]?.text}`
        : "",
      notice ? `Aviso. ${notice}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    return parts;
  }, [cardMap, result?.notice]);

  function stopSpeaking() {
    setTtsError(null);
    try {
      window.speechSynthesis.cancel();
    } catch {}
    setIsSpeaking(false);
  }

  function newDoc() {
    stopSpeaking();
    clearResult();
    clearCaptureId();
    router.push("/camera");
  }

  function startSpeaking() {
    setTtsError(null);
    if (!ttsSupported) {
      setTtsError("Seu navegador não suporta leitura em voz alta.");
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(speakText);
      u.lang = "pt-BR";
      u.rate = 0.95;
      u.pitch = 1.0;

      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => {
        setIsSpeaking(false);
        setTtsError("Não consegui ler em voz alta agora. Tente novamente.");
      };

      window.speechSynthesis.speak(u);
    } catch {
      setIsSpeaking(false);
      setTtsError("Não consegui iniciar a leitura em voz alta.");
    }
  }

  // ✅ Agora sim podemos fazer return condicional sem quebrar ordem de hooks
  if (!result) return null;

  return (
    <Screen
      header={{
        title: "Explicação do documento",
        subtitle: confidenceSubtitle,
        chips: [
          { icon: <AutoAwesomeRoundedIcon />, label: "Português simples" },
          { icon: <LockRoundedIcon />, label: "Privacidade" },
        ],
      }}
      bottomBar={
        <>
          <Button
            variant="contained"
            size="large"
            startIcon={<CameraAltRoundedIcon />}
            onClick={newDoc}
            sx={{ py: 1.4 }}
          >
            Analisar outro documento
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<HomeRoundedIcon />}
            onClick={() => {
              stopSpeaking();
              router.push("/");
            }}
            sx={{ py: 1.4 }}
          >
            Voltar ao início
          </Button>
        </>
      }
    >
      <Stack spacing={2.2}>
        {/* Confiança */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={`${confidenceInfo.emoji} Confiança: ${confidenceInfo.label}`}
            color={confidenceInfo.color}
          />
          <Typography variant="body2" color="text.secondary">
            {confidenceSubtitle}
          </Typography>
        </Stack>

        {/* TTS */}
        <Card elevation={1}>
          <CardContent>
            <Stack spacing={1.2}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <VolumeUpRoundedIcon />
                <Typography variant="h6" fontWeight={900}>
                  Ouvir a explicação
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                A leitura é feita pela voz do seu celular/navegador (não usa OpenAI).
              </Typography>

              {ttsError && (
                <Alert severity="warning" icon={false}>
                  <Typography fontWeight={900}>Atenção</Typography>
                  <Typography sx={{ mt: 0.5 }}>{ttsError}</Typography>
                </Alert>
              )}

              {!ttsSupported ? (
                <Alert severity="info" icon={false}>
                  <Typography fontWeight={900}>Leitura em voz alta indisponível</Typography>
                  <Typography sx={{ mt: 0.5 }}>
                    Seu navegador pode não suportar esta função. Você ainda pode ler a explicação abaixo.
                  </Typography>
                </Alert>
              ) : (
                <Button
                  variant={isSpeaking ? "outlined" : "contained"}
                  size="large"
                  sx={{ py: 1.4 }}
                  startIcon={isSpeaking ? <StopCircleRoundedIcon /> : <VolumeUpRoundedIcon />}
                  onClick={() => (isSpeaking ? stopSpeaking() : startSpeaking())}
                >
                  {isSpeaking ? "Parar leitura" : "Ouvir explicação"}
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>

        {showLowConfidenceHelp && (
          <Card elevation={1}>
            <CardContent>
              <Stack spacing={1.2}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <HelpOutlineRoundedIcon />
                  <Typography variant="h6" fontWeight={900}>
                    Vamos melhorar a foto?
                  </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  Com uma foto mais clara, a explicação fica bem melhor.
                </Typography>

                <Box sx={{ pl: 1 }}>
                  <Typography>• Coloque o papel numa mesa</Typography>
                  <Typography>• Aproxime até as letras ficarem nítidas</Typography>
                  <Typography>• Evite sombra e reflexo</Typography>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  sx={{ py: 1.4 }}
                  startIcon={<CameraAltRoundedIcon />}
                  onClick={newDoc}
                >
                  Tirar outra foto
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Seções */}
        <SectionCard
          icon={<DescriptionRoundedIcon />}
          title={cardMap["whatIs"]?.title || "O que é"}
          text={cardMap["whatIs"]?.text}
        />
        <SectionCard
          icon={<InfoRoundedIcon />}
          title={cardMap["whatSays"]?.title || "O que diz"}
          text={cardMap["whatSays"]?.text}
        />
        <SectionCard
          icon={<EventRoundedIcon />}
          title={cardMap["dates"]?.title || "Datas e prazos"}
          text={cardMap["dates"]?.text}
        />
        <SectionCard
          icon={<ListAltRoundedIcon />}
          title={cardMap["terms"]?.title || "Termos importantes"}
          text={cardMap["terms"]?.text}
        />
        <SectionCard
          icon={<HelpOutlineRoundedIcon />}
          title={cardMap["whatUsuallyHappens"]?.title || "O que costuma acontecer"}
          text={cardMap["whatUsuallyHappens"]?.text}
        />

        <Alert severity="warning" icon={false}>
          <Typography fontWeight={900}>⚠️ Aviso</Typography>
          <Typography sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>{result.notice}</Typography>
        </Alert>

        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
          Esta explicação é apenas informativa: ajuda a entender o documento.
          {"\n"}Ela não substitui orientação profissional.
        </Typography>

        <Divider />
        <Typography variant="body2" color="text.secondary">
          Você pode analisar outro documento quando quiser.
        </Typography>
      </Stack>
    </Screen>
  );
}
