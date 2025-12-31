"use client";

import * as React from "react";
import { CssBaseline, ThemeProvider, useMediaQuery, Box } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { buildTheme } from "./theme";

export default function Providers({ children }: { children: React.ReactNode }) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = React.useMemo(() => buildTheme(prefersDark ? "dark" : "light"), [prefersDark]);

  return (
    <AppRouterCacheProvider options={{ key: "mui", prepend: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* Fundo “nativo” consistente */}
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
          {children}
        </Box>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
