"use client";

import type { ReactNode } from "react";
import { Box, Container } from "@mui/material";
import { alpha } from "@mui/material/styles";

type ActionBarProps = {
  children: ReactNode;
};

export default function ActionBar({ children }: ActionBarProps) {
  return (
    <Box
      sx={(theme) => ({
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        p: 2,
        bgcolor: "background.default",
        borderTop: "1px solid",
        borderColor: "divider",
        zIndex: theme.zIndex.appBar,
        backdropFilter: "blur(20px)",
        backgroundColor: alpha(theme.palette.background.default, 0.9),
      })}
    >
      <Container maxWidth="sm" disableGutters>
        {children}
      </Container>
    </Box>
  );
}
