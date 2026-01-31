"use client";

import type { ReactNode } from "react";
import { Box, Container } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

type ActionBarProps = Readonly<{
  children: ReactNode;
  variant?: "default" | "sheet";
  sx?: SxProps<Theme>;
}>;

function mergeSx(base: SxProps<Theme>, extra?: SxProps<Theme>) {
  if (!extra) return [base];
  return Array.isArray(extra) ? [base, ...extra] : [base, extra];
}

export default function ActionBar({ children, variant = "default", sx }: ActionBarProps) {
  const baseSx: SxProps<Theme> = (theme) => ({
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    p: 2,
    ...(variant === "sheet"
      ? {
          bgcolor: "background.paper",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
        }
      : {
          bgcolor: "background.default",
          borderTop: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(20px)",
          backgroundColor: alpha(theme.palette.background.default, 0.9),
        }),
    zIndex: theme.zIndex.appBar,
  });

  const mergedSx = mergeSx(baseSx, sx);
  return (
    <Box sx={mergedSx}>
      <Container maxWidth="sm" disableGutters>
        {children}
      </Container>
    </Box>
  );
}
