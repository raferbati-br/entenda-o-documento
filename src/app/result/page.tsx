"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearCaptureId } from "@/lib/captureIdStore";
import { clearResult, loadResult, AnalysisResult } from "@/lib/resultStore";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  Stack,
  Typography,
  AppBar,
  Toolbar,
  Paper,
} from "@mui/material";

import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";

// === Tipos e Helpers ===
type CardT = { id: string; title: string; text: string };

function confidenceToInfo(confidence: number) {
  if (confidence < 0.45) return { label: "Baixa", color: "error.main", bg: "error.lighter", text: "Difícil de ler" };
  if (confidence < 0.75) return { label: "Média", color: "warning.main", bg: "warning.lighter", text: "Leitura parcial" };
  return { label: "Alta", color: "success.main", bg: "success.lighter", text: "Leitura clara" };
}

function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Componente de Seção Limpo (Sem Card)
function SectionBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text?: string }) {
  if (!text) return null;
  return (
    <Box sx={{ py: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ color: "primary.main" }}>{icon}</Box>
        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
          {title}
        </Typography>
      </Stack>
      <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", color: "text.primary", lineHeight: 1.6 }}>
        {text}
      </Typography>
    </Box>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // TTS State
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
    return () => {
      try { window.speechSynthesis.cancel(); } catch {}
    };
  }, []);

  const cardsArr = useMemo<CardT[]>(() => (result?.cards as CardT[]) || [], [result]);
  const cardMap = useMemo(() => Object.fromEntries(cardsArr.map((c) => [c.id, c])), [cardsArr]);
  
  const confidence = result?.confidence ?? 0;
  const confInfo = useMemo(() => confidenceToInfo(confidence), [confidence]);
  const showLowConfidenceHelp = confidence < 0.45;

  // Lógica de texto para fala
  const speakText = useMemo(() => {
    const notice = result?.notice || "";
    const parts = [
      "Explicação do documento.",
      cardMap["whatIs"]?.title ? `${cardMap["whatIs"]?.title}. ${cardMap["whatIs"]?.text}` : "",
      cardMap["whatSays"]?.title ? `${cardMap["whatSays"]?.title}. ${cardMap["whatSays"]?.text}` : "",
      cardMap["dates"]?.title ? `${cardMap["dates"]?.title}. ${cardMap["dates"]?.text}` : "",
      cardMap["terms"]?.title ? `${cardMap["terms"]?.title}. ${cardMap["terms"]?.text}` : "",
      cardMap["whatUsuallyHappens"]?.title ? `${cardMap["whatUsuallyHappens"]?.title}. ${cardMap["whatUsuallyHappens"]?.text}` : "",
      notice ? `Aviso. ${notice}` : "",
    ].filter(Boolean).join("\n\n");
    return parts;
  }, [cardMap, result?.notice]);

  function stopSpeaking() {
    setTtsError(null);
    try { window.speechSynthesis.cancel(); } catch {}
    setIsSpeaking(false);
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
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => {
        setIsSpeaking(false);
        setTtsError("Erro na leitura.");
      };
      window.speechSynthesis.speak(u);
    } catch {
      setIsSpeaking(false);
      setTtsError("Erro ao iniciar áudio.");
    }
  }

  function newDoc() {
    stopSpeaking();
    clearResult();
    clearCaptureId();
    router.push("/camera");
  }

  if (!result) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", bgcolor: "background.paper" }}>
      
      {/* 1. Navbar Sticky */}
      <AppBar 
        position="sticky" 
        color="inherit" 
        elevation={0}
        sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/')} sx={{ mr: 1 }}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Explicação
          </Typography>
          
          {/* Badge de Confiança no Header */}
          <Chip 
            label={confInfo.text} 
            size="small"
            sx={{ 
              fontWeight: 700, 
              bgcolor: confInfo.bg || 'action.hover', 
              color: confInfo.color || 'text.primary' 
            }} 
          />
        </Toolbar>
      </AppBar>

      {/* 2. Conteúdo Scrollavel */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", pb: 20 }}>
        <Container maxWidth="sm" sx={{ pt: 3, px: 3 }}>

          {/* Player de Áudio Destacado */}
          {ttsSupported && (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mb: 4, 
                bgcolor: isSpeaking ? 'primary.main' : 'background.default',
                color: isSpeaking ? 'white' : 'text.primary',
                borderColor: isSpeaking ? 'primary.main' : 'divider',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.3s ease'
              }}
            >
              <IconButton 
                onClick={isSpeaking ? stopSpeaking : startSpeaking}
                sx={{ 
                  bgcolor: isSpeaking ? 'white' : 'primary.main', 
                  color: isSpeaking ? 'primary.main' : 'white',
                  '&:hover': { bgcolor: isSpeaking ? '#f0f0f0' : 'primary.dark' }
                }}
              >
                {isSpeaking ? <StopCircleRoundedIcon /> : <VolumeUpRoundedIcon />}
              </IconButton>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  {isSpeaking ? "Lendo agora..." : "Ouvir explicação"}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {isSpeaking ? "Toque para pausar" : "Ouvir o conteúdo em áudio"}
                </Typography>
              </Box>
            </Paper>
          )}

          {ttsError && (
             <Alert severity="warning" sx={{ mb: 3 }}>{ttsError}</Alert>
          )}

          {/* Aviso de Confiança Baixa (Se houver) */}
          {showLowConfidenceHelp && (
            <Alert 
              severity="warning" 
              icon={<WarningRoundedIcon />}
              sx={{ mb: 4, borderRadius: 3 }}
              action={
                <Button color="inherit" size="small" onClick={newDoc}>
                  Refazer
                </Button>
              }
            >
              <Typography variant="subtitle2" fontWeight={700}>Foto difícil de ler</Typography>
              <Typography variant="body2">O resultado pode ter erros.</Typography>
            </Alert>
          )}

          {/* Conteúdo Principal (Texto Corrido) */}
          <Stack spacing={0} divider={<Divider sx={{ my: 1 }} />}>
            <SectionBlock
              icon={<DescriptionRoundedIcon />}
              title={cardMap["whatIs"]?.title || "O que é"}
              text={cardMap["whatIs"]?.text}
            />
            <SectionBlock
              icon={<InfoRoundedIcon />}
              title={cardMap["whatSays"]?.title || "O que diz"}
              text={cardMap["whatSays"]?.text}
            />
            <SectionBlock
              icon={<EventRoundedIcon />}
              title={cardMap["dates"]?.title || "Datas e prazos"}
              text={cardMap["dates"]?.text}
            />
            <SectionBlock
              icon={<ListAltRoundedIcon />}
              title={cardMap["terms"]?.title || "Termos importantes"}
              text={cardMap["terms"]?.text}
            />
            <SectionBlock
              icon={<HelpOutlineRoundedIcon />}
              title={cardMap["whatUsuallyHappens"]?.title || "O que costuma acontecer"}
              text={cardMap["whatUsuallyHappens"]?.text}
            />
          </Stack>

          {/* Aviso Legal / Disclaimer */}
          <Box sx={{ mt: 6, mb: 4, p: 2, bgcolor: 'action.hover', borderRadius: 3 }}>
            {result.notice && (
               <Stack direction="row" spacing={1} sx={{ mb: 1, color: "warning.main" }}>
                 <WarningRoundedIcon fontSize="small" />
                 <Typography variant="subtitle2" fontWeight={700}>Atenção</Typography>
               </Stack>
            )}
            <Typography variant="body2" color="text.secondary" paragraph>
              {result.notice}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.disabled">
              A IA pode cometer erros. Esta explicação é informativa e não substitui um advogado ou contador.
            </Typography>
          </Box>

        </Container>
      </Box>

      {/* 3. Rodapé Fixo */}
      <Box 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          p: 2, 
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 10
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<HomeRoundedIcon />}
              onClick={() => { stopSpeaking(); router.push("/"); }}
              sx={{ flex: 1 }}
            >
              Início
            </Button>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<CameraAltRoundedIcon />}
              onClick={newDoc}
              sx={{ flex: 2 }}
            >
              Analisar Outro
            </Button>
          </Stack>
        </Container>
      </Box>

    </Box>
  );
}