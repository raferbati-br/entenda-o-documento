"use client";

import type { ReactNode } from "react";
import { Box, Container } from "@mui/material";

type PageLayoutProps = {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  background?: string;
  contentPaddingTop?: number;
  contentPaddingBottom?: number;
};

export default function PageLayout({
  header,
  footer,
  children,
  background = "background.default",
  contentPaddingTop = 3,
  contentPaddingBottom = 16,
}: PageLayoutProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", bgcolor: background }}>
      {header}
      <Box sx={{ flexGrow: 1, overflowY: "auto", pb: contentPaddingBottom }}>
        <Container maxWidth="sm" sx={{ pt: contentPaddingTop, px: 3 }}>
          {children}
        </Container>
      </Box>
      {footer}
    </Box>
  );
}
