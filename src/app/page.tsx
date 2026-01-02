"use client";

import Link from "next/link";
import {
  Alert,
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
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded"; // Novo ícone para Galeria

export default function HomePage() {
  return (
    // Container principal
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: "100dvh" }}>
      
      {/* Área de Conteúdo com Scroll 
         Ajustei o padding-bottom (pb) de 24 para 16, já que o rodapé ficou mais baixo.
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

          <Box sx={{ mt: 4 }}>
             <Alert severity="warning" variant="filled" sx={{ borderRadius: 2, color: '#fff', bgcolor: 'warning.main' }}>
              <Typography variant="body2" fontWeight={600}>
                Aviso: A IA ajuda a entender, mas não substitui orientação profissional.
              </Typography>
            </Alert>
          </Box>

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
          bgcolor: 'background.default', // Garante legibilidade
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 10,
          backdropFilter: 'blur(20px)', 
          backgroundColor: 'rgba(255,255,255,0.9)' 
        }}
      >
        <Container maxWidth="sm" disableGutters>
          {/* MUDANÇA AQUI: Botões Lado a Lado (Row) */}
          <Stack direction="row" spacing={2}>
            
            {/* Botão Secundário: Galeria */}
            <Button
              component={Link}
              href="/camera?source=gallery"
              variant="outlined"
              size="large"
              startIcon={<PhotoLibraryRoundedIcon />}
              sx={{ 
                flex: 1, // Ocupa 1 parte do espaço
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
                flex: 1, // Mesmo tamanho do outro botão
                height: 56, 
                fontWeight: 700, 
                fontSize: '1rem',
                boxShadow: '0 8px 16px rgba(0,102,204,0.2)' // Sombra suave para destacar
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