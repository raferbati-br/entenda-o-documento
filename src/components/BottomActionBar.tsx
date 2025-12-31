"use client";

import * as React from "react";
import { Container, Paper, Stack, SxProps, Theme } from "@mui/material";

type BottomActionBarProps = {
  children: React.ReactNode;

  /** Espaço extra no container interno (além do safe-area) */
  paddingTop?: number;

  /** Elevação do Paper */
  elevation?: number;

  /** Sx extra no Paper */
  sx?: SxProps<Theme>;

  /** maxWidth do Container interno */
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
};

/**
 * Barra fixa no rodapé (estilo app), com:
 * - safe-area (iPhone notch / barra inferior)
 * - largura centralizada (Container)
 * - visual consistente com o theme MUI
 */
export default function BottomActionBar({
  children,
  paddingTop = 12,
  elevation = 8,
  sx,
  maxWidth = "sm",
}: BottomActionBarProps) {
  return (
    <Paper
      elevation={elevation}
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.drawer + 1,
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        px: 2,
        pt: `${paddingTop}px`,
        pb: "calc(env(safe-area-inset-bottom) + 12px)",
        ...sx,
      }}
    >
      <Container maxWidth={maxWidth} sx={{ p: 0 }}>
        <Stack spacing={1.2}>{children}</Stack>
      </Container>
    </Paper>
  );
}