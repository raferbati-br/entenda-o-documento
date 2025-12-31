"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";

export type PremiumHeaderChip = {
  icon: React.ReactNode;
  label: string;
};

type PremiumHeaderProps = {
  title: string;
  subtitle?: string;
  chips?: PremiumHeaderChip[];
};

export default function PremiumHeader({
  title,
  subtitle,
  chips,
}: PremiumHeaderProps) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        p: 2,
        mb: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Gradiente decorativo */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(900px 260px at 15% 0%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(700px 240px at 95% 20%, rgba(16,185,129,0.16), transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <Stack spacing={1} sx={{ position: "relative" }}>
        {chips && chips.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexWrap: "wrap" }}
          >
            {chips.map((c, idx) => (
              <Chip
                key={idx}
                icon={c.icon as any}
                label={c.label}
                size="small"
                sx={{ fontWeight: 800 }}
              />
            ))}
          </Stack>
        )}

        <Typography variant="h5" fontWeight={900}>
          {title}
        </Typography>

        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
