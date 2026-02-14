"use client";

import * as React from "react";
import { Box, CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import { buildTheme } from "../theme";

const STORAGE_TEXT_SCALE_PRESET = "eod_text_scale_preset";
const STORAGE_CONTRAST_OVERRIDE = "eod_contrast_override";
const LEGACY_STORAGE_FONT_SCALE = "eod_font_scale";
const LEGACY_STORAGE_HIGH_CONTRAST = "eod_high_contrast";

type TextScalePreset = "normal" | "large" | "xlarge";
type ContrastOverride = "auto" | "high";

const TEXT_SCALE_MULTIPLIER: Record<TextScalePreset, number> = {
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
};

type AccessibilityContextValue = Readonly<{
  textScalePreset: TextScalePreset;
  contrastOverride: ContrastOverride;
  systemPrefersDark: boolean;
  systemPrefersHighContrast: boolean;
  effectiveHighContrast: boolean;
  effectiveTextScaleMultiplier: number;
  setTextScalePreset: (preset: TextScalePreset) => void;
  setContrastOverride: (mode: ContrastOverride) => void;
}>;

const AccessibilityContext = React.createContext<AccessibilityContextValue | null>(null);

function parseLegacyTextScale(fontScale: string | null): TextScalePreset | null {
  if (!fontScale) return null;
  const value = Number.parseFloat(fontScale);
  if (Number.isNaN(value)) return null;
  if (value >= 1.15) return "xlarge";
  if (value >= 1.05) return "large";
  return "normal";
}

type AccessibilityProviderProps = Readonly<{
  children: React.ReactNode;
}>;

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const systemPrefersHighContrast = useMediaQuery("(prefers-contrast: more)");
  const [textScalePreset, setTextScalePreset] = React.useState<TextScalePreset>("normal");
  const [contrastOverride, setContrastOverride] = React.useState<ContrastOverride>("auto");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const storedPreset = window.localStorage.getItem(STORAGE_TEXT_SCALE_PRESET);
    if (storedPreset === "normal" || storedPreset === "large" || storedPreset === "xlarge") {
      setTextScalePreset(storedPreset);
    } else {
      const legacyPreset = parseLegacyTextScale(window.localStorage.getItem(LEGACY_STORAGE_FONT_SCALE));
      if (legacyPreset) {
        setTextScalePreset(legacyPreset);
      }
    }

    const storedContrast = window.localStorage.getItem(STORAGE_CONTRAST_OVERRIDE);
    if (storedContrast === "auto" || storedContrast === "high") {
      setContrastOverride(storedContrast);
    } else if (window.localStorage.getItem(LEGACY_STORAGE_HIGH_CONTRAST) === "true") {
      setContrastOverride("high");
    }
  }, []);

  const effectiveTextScaleMultiplier = TEXT_SCALE_MULTIPLIER[textScalePreset];
  const effectiveHighContrast = systemPrefersHighContrast || contrastOverride === "high";
  const theme = React.useMemo(
    () => buildTheme(systemPrefersDark ? "dark" : "light", effectiveHighContrast),
    [systemPrefersDark, effectiveHighContrast]
  );

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty("--text-scale-multiplier", String(effectiveTextScaleMultiplier));
    document.documentElement.style.setProperty("--font-scale", String(effectiveTextScaleMultiplier));
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_TEXT_SCALE_PRESET, textScalePreset);
    }
  }, [effectiveTextScaleMultiplier, textScalePreset]);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.contrast = effectiveHighContrast ? "high" : "normal";
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_CONTRAST_OVERRIDE, contrastOverride);
    }
  }, [contrastOverride, effectiveHighContrast]);

  const value = React.useMemo<AccessibilityContextValue>(
    () => ({
      textScalePreset,
      contrastOverride,
      systemPrefersDark,
      systemPrefersHighContrast,
      effectiveHighContrast,
      effectiveTextScaleMultiplier,
      setTextScalePreset,
      setContrastOverride,
    }),
    [
      textScalePreset,
      contrastOverride,
      systemPrefersDark,
      systemPrefersHighContrast,
      effectiveHighContrast,
      effectiveTextScaleMultiplier,
    ]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>{children}</Box>
      </ThemeProvider>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilitySettings() {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibilitySettings must be used within AccessibilityProvider");
  }
  return context;
}

export type { TextScalePreset, ContrastOverride };
