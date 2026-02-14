"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ensureSessionToken } from "@/lib/sessionToken";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";
import { AccessibilityProvider } from "./acessibilidade/AccessibilityContext";

export default function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
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
      <AccessibilityProvider>{children}</AccessibilityProvider>
    </AppRouterCacheProvider>
  );
}
