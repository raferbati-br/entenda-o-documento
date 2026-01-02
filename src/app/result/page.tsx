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
  Snackbar,
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
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";

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

// Componente de Seção Limpo
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

  // Share State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
      try { window.speechSynthesis.cancel(); } catch { }
    };
  }, []);

  const cardsArr = useMemo<CardT[]>(() => (result?.cards as CardT[]) || [], [result]);
  const cardMap = useMemo(() => Object.fromEntries(cardsArr.map((c) => [c.id, c])), [cardsArr]);

  const confidence = result?.confidence ?? 0;
  const confInfo = useMemo(() => confidenceToInfo(confidence), [confidence]);
  const showLowConfidenceHelp = confidence < 0.45;

  // Texto completo para Leitura e Compartilhamento
  const fullText = useMemo(() => {
    const notice = result?.notice || "";
    const parts = [
      "📋 *Explicação do Documento*",
      "",
      cardMap["whatIs"]?.title ? `*${cardMap["whatIs"]?.title}*\n${cardMap["whatIs"]?.text}` : "",
      cardMap["whatSays"]?.title ? `*${cardMap["whatSays"]?.title}*\n${cardMap["whatSays"]?.text}` : "",
      cardMap["dates"]?.title ? `*${cardMap["dates"]?.title}*\n${cardMap["dates"]?.text}` : "",
      cardMap["terms"]?.title ? `*${cardMap["terms"]?.title}*\n${cardMap["terms"]?.text}` : "",
      cardMap["whatUsuallyHappens"]?.title ? `*${cardMap["whatUsuallyHappens"]?.title}*\n${cardMap["whatUsuallyHappens"]?.text}` : "",
      notice ? `⚠️ *Aviso*\n${notice}` : "",
      "",
      "Gerado por Entenda o Documento"
    ].filter(Boolean).join("\n\n");
    return parts;
  }, [cardMap, result?.notice]);

  // Função de Compartilhar
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Explicação do Documento',
          text: fullText,
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback para PC
      try {
        await navigator.clipboard.writeText(fullText);
        setToastMsg("Texto copiado para a área de transferência!");
      } catch (err) {
        setToastMsg("Não foi possível copiar o texto.");
      }
    }
  };

  // Funções de Áudio
  const speakText = useMemo(() => fullText.replace(/\*/g, ""), [fullText]);

  function stopSpeaking() {
    setTtsError(null);
    try { window.speechSynthesis.cancel(); } catch { }
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

          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              Explicação
            </Typography>
            <Chip
              label={confInfo.text}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: confInfo.bg || 'action.hover',
                color: confInfo.color || 'text.primary'
              }}
            />
          </Box>

          <IconButton onClick={handleShare} color="primary">
            <IosShareRoundedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 2. Conteúdo Scrollavel */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", pb: 20 }}>
        <Container maxWidth="sm" sx={{ pt: 3, px: 3 }}>

          {/* Player de Áudio */}
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

          {/* Conteúdo Principal */}
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
              // Remove emojis duplicados do título se a IA mandar
              title={cardMap["terms"]?.title?.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '') || "Termos importantes"}
              text={cardMap["terms"]?.text}
            />
            <SectionBlock
              icon={<HelpOutlineRoundedIcon />}
              title={cardMap["whatUsuallyHappens"]?.title || "O que costuma acontecer"}
              text={cardMap["whatUsuallyHappens"]?.text}
            />
          </Stack>

          {/* --- AVISOS E RODAPÉ DO CONTEÚDO --- */}

          {/* 1. Aviso Dinâmico da IA (Só aparece se tiver observação importante) */}
          {result.notice && (
            <Box sx={{ mt: 4, mb: 2, p: 2, bgcolor: '#FFF4E5', borderRadius: 2, color: '#663C00' }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <WarningRoundedIcon sx={{ fontSize: 20, mt: 0.2, color: '#EF6C00' }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                    Observação Importante
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                    {result.notice}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* 2. Aviso Legal Padrão (Igual Home - Discreto) */}
          <Box sx={{ mt: result.notice ? 2 : 4, mb: 4, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <InfoRoundedIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                A Inteligência Artificial ajuda a entender o conteúdo, mas pode cometer erros.
                Esta ferramenta é informativa e não substitui a consulta com um profissional.
              </Typography>
            </Stack>
          </Box>
          
          <Box sx={{ height: 20 }} />

        </Container>
      </Box>

      {/* 3. Rodapé Fixo (Estilo Home) */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 10,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255,255,255,0.9)'
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
              sx={{ flex: 1, height: 56, fontWeight: 700, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
            >
              Início
            </Button>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<CameraAltRoundedIcon />}
              onClick={newDoc}
              sx={{ flex: 1, height: 56, fontWeight: 700 }}
            >
              Analisar Outro
            </Button>
          </Stack>
        </Container>
      </Box>

      <Snackbar
        open={!!toastMsg}
        autoHideDuration={3000}
        onClose={() => setToastMsg(null)}
        message={toastMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, sm: 24 } }}
      />

    </Box>
  );
}