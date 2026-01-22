"use client";

import type { ReactNode } from "react";
import { AppBar, Toolbar } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

type PageHeaderProps = {
  children: ReactNode;
  sx?: SxProps<Theme>;
};

export default function PageHeader({ children, sx }: PageHeaderProps) {
  const baseSx: SxProps<Theme> = (theme) => ({
    borderBottom: "1px solid",
    borderColor: "divider",
    bgcolor: alpha(theme.palette.background.default, 0.95),
    backdropFilter: "blur(10px)",
  });

  const mergedSx = Array.isArray(sx) ? [baseSx, ...sx] : sx ? [baseSx, sx] : [baseSx];
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={mergedSx}
    >
      <Toolbar>{children}</Toolbar>
    </AppBar>
  );
}
