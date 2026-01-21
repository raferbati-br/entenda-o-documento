"use client";

import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { SECTION_ICON_COLOR, SECTION_ICON_SIZE, SECTION_TITLE_STYLE } from "./iconStyles";

type SectionBlockProps = {
  icon: ReactNode;
  title: string;
  text?: string;
  children?: ReactNode;
  actions?: ReactNode;
  iconColor?: string;
  iconSize?: number;
};

export default function SectionBlock({
  icon,
  title,
  text,
  children,
  actions,
  iconColor = SECTION_ICON_COLOR,
  iconSize = SECTION_ICON_SIZE,
}: SectionBlockProps) {
  if (!text && !children) return null;
  return (
    <Box sx={{ py: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ color: iconColor, fontSize: iconSize }}>{icon}</Box>
        <Typography variant="body1" sx={SECTION_TITLE_STYLE}>
          {title}
        </Typography>
        {actions ? <Box sx={{ flexGrow: 1 }} /> : null}
        {actions ? <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>{actions}</Box> : null}
      </Stack>
      {text ? (
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "text.secondary", lineHeight: 1.5 }}>
          {text}
        </Typography>
      ) : null}
      {children ? <Box sx={{ mt: text ? 1.5 : 1 }}>{children}</Box> : null}
    </Box>
  );
}
