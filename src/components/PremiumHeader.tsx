"use client";

import React from "react";
import { Chip, Paper, Stack, Typography } from "@mui/material";

export type PremiumHeaderChip = {
  icon: React.ReactNode;
  label: string;
};

type PremiumHeaderProps = {
  title: string;
  subtitle?: string;
  chips?: PremiumHeaderChip[];
};

export default function PremiumHeader({ title, subtitle, chips }: PremiumHeaderProps) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        // 🔑 chave da solução
        borderRadius: "0 0 16px 16px", // sem arco em cima
        p: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
      })}
    >
      <Stack spacing={1}>
        {chips?.length ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {chips.map((c, idx) => (
              <Chip
                key={idx}
                icon={c.icon as any}
                label={c.label}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            ))}
          </Stack>
        ) : null}

        <Typography variant="h5" fontWeight={900} lineHeight={1.15}>
          {title}
        </Typography>

        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.35 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
