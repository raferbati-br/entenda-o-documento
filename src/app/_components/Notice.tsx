"use client";

import type { ReactNode } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

type NoticeSeverity = "info" | "warning" | "error" | "success";

type NoticeProps = {
  severity?: NoticeSeverity;
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
  variant?: "inline" | "hero";
  density?: "default" | "compact";
  sx?: SxProps<Theme>;
};

const ICONS: Record<NoticeSeverity, typeof InfoRoundedIcon> = {
  info: InfoRoundedIcon,
  warning: WarningRoundedIcon,
  error: ErrorRoundedIcon,
  success: CheckCircleRoundedIcon,
};

export default function Notice({
  severity = "info",
  title,
  children,
  actions,
  onClose,
  variant = "inline",
  density = "default",
  sx,
}: NoticeProps) {
  const Icon = ICONS[severity];
  const isHero = variant === "hero";
  const isCompact = density === "compact" && !isHero;
  const iconSize = isHero ? 56 : isCompact ? 18 : 20;

  const baseSx: SxProps<Theme> = (theme) => ({
    borderRadius: isHero ? 3 : isCompact ? 1.5 : 2,
    p: isHero ? 3 : isCompact ? 1 : 1.25,
    border: "0.5px solid",
    borderColor: alpha(theme.palette[severity].main, 0.35),
    bgcolor: alpha(theme.palette[severity].main, 0.08),
  });

  const mergedSx = Array.isArray(sx) ? [baseSx, ...sx] : sx ? [baseSx, sx] : [baseSx];

  return (
    <Box sx={mergedSx}>
      <Stack
        direction={isHero ? "column" : "row"}
        spacing={isHero ? 1.5 : 1.25}
        alignItems={isHero ? "center" : "center"}
      >
        <Box
          sx={{
            color: `${severity}.main`,
            fontSize: iconSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon fontSize="inherit" />
        </Box>
        <Box sx={{ flex: 1, textAlign: isHero ? "center" : "left" }}>
          {title && children && !isHero ? (
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                {title}:
              </Box>{" "}
              {children}
            </Typography>
          ) : title ? (
            <Typography variant={isHero ? "h5" : "subtitle2"} fontWeight={700} sx={{ mb: children ? 0.5 : 0 }}>
              {title}
            </Typography>
          ) : null}
          {children && (!title || isHero) ? (
            <Typography variant={isHero ? "body1" : "body2"} color="text.secondary">
              {children}
            </Typography>
          ) : null}
        </Box>
        {actions ? <Box sx={{ alignSelf: isHero ? "center" : "center" }}>{actions}</Box> : null}
        {onClose ? (
          <IconButton size="small" aria-label="Fechar aviso" onClick={onClose}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        ) : null}
      </Stack>
    </Box>
  );
}
