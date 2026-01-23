"use client";

import type { ReactNode, Ref, UIEventHandler } from "react";
import { Box, Container } from "@mui/material";
import type { ContainerProps } from "@mui/material/Container";
import type { SxProps, Theme } from "@mui/material/styles";

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
  contentRef?: Ref<HTMLDivElement>;
  onContentScroll?: UIEventHandler<HTMLDivElement>;
  contentSx?: SxProps<Theme>;
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
  contentRef,
  onContentScroll,
  contentSx,
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
      <Box
        ref={contentRef}
        onScroll={onContentScroll}
        sx={{ flexGrow: 1, overflowY: "auto", pb: contentPaddingBottom, ...(contentSx || {}) }}
      >
        {content}
      </Box>
      {footer}
    </Box>
  );
}
