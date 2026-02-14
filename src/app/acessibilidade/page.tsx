"use client";

import { useRouter } from "next/navigation";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import BackHeader from "../_components/BackHeader";
import PageLayout from "../_components/PageLayout";
import {
  useAccessibilitySettings,
  type ContrastOverride,
  type TextScalePreset,
} from "./AccessibilityContext";

export default function AccessibilityPage() {
  const router = useRouter();
  const {
    textScalePreset,
    contrastOverride,
    systemPrefersDark,
    systemPrefersHighContrast,
    effectiveHighContrast,
    effectiveTextScaleMultiplier,
    setTextScalePreset,
    setContrastOverride,
  } = useAccessibilitySettings();

  return (
    <PageLayout
      header={<BackHeader onBack={() => router.back()} title="Leitura e acessibilidade" />}
      contentPaddingBottom={4}
    >
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          O app segue automaticamente as configurações do sistema. As opções abaixo funcionam como ajuste manual.
        </Typography>

        <Paper elevation={1} sx={{ p: 2.5 }}>
          <FormControl>
            <FormLabel id="text-size-group-label">Tamanho do texto</FormLabel>
            <RadioGroup
              aria-labelledby="text-size-group-label"
              value={textScalePreset}
              onChange={(event) => setTextScalePreset(event.target.value as TextScalePreset)}
            >
              <FormControlLabel value="normal" control={<Radio />} label="Normal" />
              <FormControlLabel value="large" control={<Radio />} label="Grande" />
              <FormControlLabel value="xlarge" control={<Radio />} label="Muito grande" />
            </RadioGroup>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            Escala efetiva atual: {effectiveTextScaleMultiplier.toFixed(2)}x da base do sistema.
          </Typography>
        </Paper>

        <Paper elevation={1} sx={{ p: 2.5 }}>
          <FormControl>
            <FormLabel id="contrast-group-label">Contraste</FormLabel>
            <RadioGroup
              aria-labelledby="contrast-group-label"
              value={contrastOverride}
              onChange={(event) => setContrastOverride(event.target.value as ContrastOverride)}
            >
              <FormControlLabel value="auto" control={<Radio />} label="Padrão" />
              <FormControlLabel value="high" control={<Radio />} label="Alto contraste" />
            </RadioGroup>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            Sistema: tema {systemPrefersDark ? "escuro" : "claro"}; alto contraste do sistema{" "}
            {systemPrefersHighContrast ? "ativo" : "inativo"}.
          </Typography>
        </Paper>

        <Paper elevation={1} sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Preview
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Este texto usa a escala combinada (sistema + ajuste manual).
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contraste efetivo: {effectiveHighContrast ? "Alto contraste" : "Padrão"}.
          </Typography>
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            <Typography variant="body2">Título e textos longos devem continuar legíveis sem quebrar o layout.</Typography>
          </Box>
        </Paper>
      </Stack>
    </PageLayout>
  );
}
