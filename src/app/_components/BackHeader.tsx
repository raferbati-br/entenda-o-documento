"use client";

import type { ReactNode } from "react";
import type { IconButtonProps } from "@mui/material/IconButton";
import type { SxProps, Theme } from "@mui/material/styles";
import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

type BackHeaderProps = Readonly<{
  onBack: () => void;
  title: ReactNode;
  endContent?: ReactNode;
  icon?: ReactNode;
  headerSx?: SxProps<Theme>;
  titleSx?: SxProps<Theme>;
  iconButtonSx?: SxProps<Theme>;
  iconButtonProps?: Partial<IconButtonProps>;
}>;

function normalizeSx(extra?: SxProps<Theme>) {
  if (!extra) return [];
  return Array.isArray(extra) ? extra : [extra];
}

export default function BackHeader({
  onBack,
  title,
  endContent,
  icon,
  headerSx,
  titleSx,
  iconButtonSx,
  iconButtonProps,
}: BackHeaderProps) {
  const titleNode =
    typeof title === "string" ? (
      <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
    ) : (
      title
    );
  const iconSx: SxProps<Theme> = [{ mr: 1 }, ...normalizeSx(iconButtonSx)];
  const titleBoxSx: SxProps<Theme> = [
    { flexGrow: 1, display: "flex", alignItems: "center" },
    ...normalizeSx(titleSx),
  ];
  const baseSx: SxProps<Theme> = (theme) => ({
    borderBottom: "1px solid",
    borderColor: "divider",
    bgcolor: alpha(theme.palette.background.default, 0.95),
    backdropFilter: "blur(10px)",
  });

  const mergedSx = headerSx ? [baseSx, ...normalizeSx(headerSx)] : [baseSx];

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={mergedSx}>
      <Toolbar>
        <IconButton edge="start" onClick={onBack} sx={iconSx} aria-label="Voltar" {...iconButtonProps}>
          {icon ?? <ArrowBackRoundedIcon />}
        </IconButton>
        <Box sx={titleBoxSx}>{titleNode}</Box>
        {endContent}
      </Toolbar>
    </AppBar>
  );
}
