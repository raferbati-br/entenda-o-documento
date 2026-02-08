"use client";

import type { MouseEventHandler } from "react";
import { Paper, Stack, Button } from "@mui/material";
import BrightnessHighRoundedIcon from "@mui/icons-material/BrightnessHighRounded";

type AccessibilityControlsProps = Readonly<{
  canIncreaseFont: boolean;
  canDecreaseFont: boolean;
  onIncreaseFont: MouseEventHandler<HTMLButtonElement>;
  onDecreaseFont: MouseEventHandler<HTMLButtonElement>;
  highContrast: boolean;
  onToggleContrast: MouseEventHandler<HTMLButtonElement>;
}>;

export default function AccessibilityControls({
  canIncreaseFont,
  canDecreaseFont,
  onIncreaseFont,
  onDecreaseFont,
  highContrast,
  onToggleContrast,
}: AccessibilityControlsProps) {
  return (
    <Paper
      elevation={1}
      sx={(theme) => ({
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 8px)",
        right: 12,
        zIndex: theme.zIndex.appBar + 1,
        px: 1,
        py: 0.75,
        borderRadius: 999,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        backdropFilter: "blur(8px)",
      })}
      aria-label="Controles de acessibilidade"
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          size="small"
          variant="outlined"
          onClick={onDecreaseFont}
          disabled={!canDecreaseFont}
          aria-label="Diminuir tamanho da fonte"
        >
          A-
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={onIncreaseFont}
          disabled={!canIncreaseFont}
          aria-label="Aumentar tamanho da fonte"
        >
          A+
        </Button>
        <Button
          size="small"
          variant={highContrast ? "contained" : "outlined"}
          onClick={onToggleContrast}
          aria-pressed={highContrast}
          aria-label="Alternar alto contraste"
          startIcon={<BrightnessHighRoundedIcon fontSize="small" />}
        >
          Contraste
        </Button>
      </Stack>
    </Paper>
  );
}
