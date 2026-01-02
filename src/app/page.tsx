"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded"; // Importei o ícone de aviso

export default function HomePage() {
  return (
    // Container principal
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: "100dvh" }}>
      
      {/* Área de Conteúdo com Scroll 
         pb: 16 garante que o conteúdo não fique escondido atrás do rodapé fixo
      */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pb: 16 }}> 
        <Container maxWidth="sm" sx={{ pt: 4, px: 3 }}>
          
          {/* HERO */}
          <Stack spacing={2} sx={{ mb: 4 }}>
            <Stack direction="row" spacing={1}>
              <Chip
                label="Português simples"
                size="small"
                color="primary"
                sx={{ bgcolor: 'rgba(0,102,204,0.1)', color: 'primary.main', border: 'none', fontWeight: 600 }}
              />
               <Chip
                label="Privado"
                size="small"
                sx={{ bgcolor: 'rgba(0,0,0,0.05)', border: 'none', fontWeight: 600 }}
              />
            </Stack>

            <Typography variant="h4" gutterBottom fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
              Entenda qualquer documento num piscar de olhos
            </Typography>

            <Typography color="text.secondary" variant="body1" sx={{ lineHeight: 1.6 }}>
              Tire uma foto daquela carta difícil ou conta complicada e receba uma explicação direto ao ponto.
            </Typography>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Lista de Benefícios */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>O que funciona bem?</Typography>
          
          <List disablePadding>
            <FeatureItem 
              icon={<DescriptionRoundedIcon color="action" />}
              title="Documentos Burocráticos"
              desc="Cartas judiciais, contas, comunicados e avisos."
            />
            <FeatureItem 
              icon={<AutoAwesomeRoundedIcon color="action" />}
              title="Explicação Simples"
              desc="Traduzimos o 'juridiquês' para o português do dia a dia."
            />
            <FeatureItem 
              icon={<LockRoundedIcon color="action" />}
              title="Privacidade Total"
              desc="Sua foto é processada e deletada. Nada fica salvo."
            />
          </List>

          {/* AVISO DISCRETO (Novo Design) */}
          <Box sx={{ mt: 4, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <WarningRoundedIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                A Inteligência Artificial ajuda a entender o conteúdo, mas pode cometer erros. 
                Esta ferramenta é informativa e não substitui a consulta com um profissional.
              </Typography>
            </Stack>
          </Box>
          
          {/* Espaço extra para scroll final */}
          <Box sx={{ height: 20 }} /> 

        </Container>
      </Box>

      {/* RODAPÉ FIXO (Sticky Footer) */}
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
            
            {/* Botão Secundário: Galeria */}
            <Button
              component={Link}
              href="/camera?source=gallery"
              variant="outlined"
              size="large"
              startIcon={<PhotoLibraryRoundedIcon />}
              sx={{ 
                flex: 1, 
                height: 56, 
                fontWeight: 700,
                borderWidth: 2,
                '&:hover': { borderWidth: 2 } 
              }}
            >
              Galeria
            </Button>
            
            {/* Botão Principal: Câmera */}
            <Button
              component={Link}
              href="/camera"
              variant="contained"
              size="large"
              startIcon={<CameraAltRoundedIcon />}
              sx={{ 
                flex: 1, 
                height: 56, 
                fontWeight: 700, 
                fontSize: '1rem',
                boxShadow: '0 8px 16px rgba(0,102,204,0.2)' 
              }}
            >
              Tirar foto
            </Button>

          </Stack>
        </Container>
      </Box>

    </Box>
  );
}

// Sub-componente
function FeatureItem({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <ListItem disableGutters sx={{ py: 1.5, alignItems: 'flex-start' }}>
      <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
        {icon}
      </ListItemIcon>
      <ListItemText 
        primary={<Typography fontWeight={700} gutterBottom>{title}</Typography>}
        secondary={<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>{desc}</Typography>}
      />
    </ListItem>
  )
}