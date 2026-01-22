"use client";

import type { ReactNode } from "react";
import { Box, Container } from "@mui/material";
import type { ContainerProps } from "@mui/material/Container";

type PageLayoutProps = {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  background?: string;
  contentPaddingTop?: number;
  contentPaddingBottom?: number;
  contentPaddingX?: number;
  disableContainer?: boolean;
  containerMaxWidth?: ContainerProps["maxWidth"];
};

export default function PageLayout({
  header,
  footer,
  children,
  background = "background.default",
  contentPaddingTop = 3,
  contentPaddingBottom = 16,
  contentPaddingX = 3,
  disableContainer = false,
  containerMaxWidth = "sm",
}: PageLayoutProps) {
  const content = disableContainer ? (
    <Box sx={{ pt: contentPaddingTop, px: contentPaddingX }}>{children}</Box>
  ) : (
    <Container maxWidth={containerMaxWidth} sx={{ pt: contentPaddingTop, px: contentPaddingX }}>
      {children}
    </Container>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", bgcolor: background }}>
      {header}
      <Box sx={{ flexGrow: 1, overflowY: "auto", pb: contentPaddingBottom }}>
        {content}
      </Box>
      {footer}
    </Box>
  );
}
