"use client";

import React from "react";
import { Box } from "@mui/material";
import PremiumHeader, { PremiumHeaderChip } from "@/components/PremiumHeader";
import BottomActionBar from "@/components/BottomActionBar";

type ScreenProps = {
  header: {
    title: string;
    subtitle?: string;
    chips?: PremiumHeaderChip[];
  };
  children: React.ReactNode;
  bottomBar?: React.ReactNode;
};

export default function Screen({ header, children, bottomBar }: ScreenProps) {
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          flex: 1,
          px: 2,
          pt: 0, // 🔑 sem padding antes do header
          pb: bottomBar ? "calc(env(safe-area-inset-bottom) + 120px)" : 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <PremiumHeader title={header.title} subtitle={header.subtitle} chips={header.chips} />
        {children}
      </Box>

      {bottomBar ? <BottomActionBar>{bottomBar}</BottomActionBar> : null}
    </Box>
  );
}
