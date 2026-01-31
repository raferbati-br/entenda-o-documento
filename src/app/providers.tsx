"use client";

import * as React from "react";
import { CssBaseline, ThemeProvider, useMediaQuery, Box } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { buildTheme } from "./theme";
import { ensureSessionToken } from "@/lib/sessionToken";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";

export default function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = React.useMemo(() => buildTheme(prefersDark ? "dark" : "light"), [prefersDark]);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    ensureSessionToken().catch(() => {});
  }, []);

  React.useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    const posthogLoaded = (posthog as { __loaded?: boolean }).__loaded;
    if (posthogLoaded) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      capture_pageview: false,
      autocapture: false,
      disable_session_recording: true,
    });
  }, []);

  React.useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    const search = searchParams?.toString();
    posthog.capture("page_view", {
      path: pathname,
      search: search || "",
    });
  }, [pathname, searchParams]);

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
