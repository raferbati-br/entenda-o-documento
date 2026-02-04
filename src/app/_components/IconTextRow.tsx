"use client";

import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { SECTION_TITLE_STYLE } from "./iconStyles";
type IconTextRowProps = Readonly<{
  icon: ReactNode;
  title: string;
  description: string;
  iconColor?: string;
  iconBackground?: string;
  iconSize?: number;
  iconContainerSize?: number;
  compact?: boolean;
}>;

export default function IconTextRow({
  icon,
  title,
  description,
  iconColor,
  iconBackground = "action.hover",
  iconSize = 24,
  iconContainerSize = 48,
  compact = false,
}: IconTextRowProps) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          width: iconContainerSize,
          height: iconContainerSize,
          borderRadius: "50%",
          bgcolor: iconBackground,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: iconSize,
          ...(iconColor ? { color: iconColor } : {}),
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: compact ? "0 1 auto" : 1 }}>
        <Typography variant="body1" sx={SECTION_TITLE_STYLE}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.5 }}>
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}
