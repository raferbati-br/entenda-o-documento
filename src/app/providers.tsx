"use client";

import * as React from "react";
import { CssBaseline, ThemeProvider, useMediaQuery, Box } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { buildTheme } from "./theme";
import { ensureSessionToken } from "@/lib/sessionToken";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";
import AccessibilityControls from "./_components/AccessibilityControls";

const FONT_SCALE_MIN = 0.9;
const FONT_SCALE_MAX = 1.2;
const FONT_SCALE_STEP = 0.1;
const STORAGE_FONT_SCALE = "eod_font_scale";
const STORAGE_HIGH_CONTRAST = "eod_high_contrast";

function clampFontScale(value: number) {
  if (value < FONT_SCALE_MIN) return FONT_SCALE_MIN;
  if (value > FONT_SCALE_MAX) return FONT_SCALE_MAX;
  return Math.round(value * 10) / 10;
}

export default function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [fontScale, setFontScale] = React.useState(1);
  const [highContrast, setHighContrast] = React.useState(false);
  const theme = React.useMemo(
    () => buildTheme(prefersDark ? "dark" : "light", highContrast),
    [prefersDark, highContrast]
  );
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const storedScale = window.localStorage.getItem(STORAGE_FONT_SCALE);
    if (storedScale) {
      const parsed = Number.parseFloat(storedScale);
      if (!Number.isNaN(parsed)) {
        setFontScale(clampFontScale(parsed));
      }
    }

    const storedContrast = window.localStorage.getItem(STORAGE_HIGH_CONTRAST);
    if (storedContrast === "true") {
      setHighContrast(true);
    }
  }, []);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty("--font-scale", fontScale.toString());
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_FONT_SCALE, fontScale.toString());
    }
  }, [fontScale]);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.contrast = highContrast ? "high" : "normal";
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_HIGH_CONTRAST, String(highContrast));
    }
  }, [highContrast]);

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
        <AccessibilityControls
          canDecreaseFont={fontScale > FONT_SCALE_MIN + 0.001}
          canIncreaseFont={fontScale < FONT_SCALE_MAX - 0.001}
          onDecreaseFont={() => setFontScale((current) => clampFontScale(current - FONT_SCALE_STEP))}
          onIncreaseFont={() => setFontScale((current) => clampFontScale(current + FONT_SCALE_STEP))}
          highContrast={highContrast}
          onToggleContrast={() => setHighContrast((current) => !current)}
        />
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
