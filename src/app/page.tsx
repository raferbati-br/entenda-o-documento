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

export default function HomePage() {
  return (
    // Container principal
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: "100dvh" }}>
      
      {/* Área de Conteúdo com Scroll 
         MUDANÇA AQUI: Aumentei pb de 12 para 24 para garantir que o último 
         item passe por cima do rodapé fixo alto.
      */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pb: 24 }}> 
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

            <Typography variant="h4" gutterBottom>
              Entenda qualquer documento num piscar de olhos
            </Typography>

            <Typography color="text.secondary" variant="body1">
              Tire uma foto daquela carta difícil ou conta complicada e receba uma explicação direto ao ponto.
            </Typography>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Lista de Benefícios */}
          <Typography variant="h6" sx={{ mb: 2 }}>O que funciona bem?</Typography>
          
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
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 10,
          // Garante legibilidade mesmo se o fundo for transparente no iOS
          backdropFilter: 'blur(20px)', 
          backgroundColor: 'rgba(255,255,255,0.9)' 
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <Stack spacing={1.5}>
            <Button
              component={Link}
              href="/camera"
              variant="contained"
              size="large"
              fullWidth
              startIcon={<CameraAltRoundedIcon />}
              sx={{ height: 56, fontSize: '1.1rem' }}
            >
              Tirar foto agora
            </Button>
            
            <Button
              component={Link}
              href="/camera?source=gallery"
              variant="text"
              size="medium"
              fullWidth
              sx={{ color: 'text.secondary', fontWeight: 600 }}
            >
              Ou escolha da galeria
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