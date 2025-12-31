// src/app/theme.ts
import { createTheme, responsiveFontSizes } from "@mui/material/styles";

export function buildTheme(mode: "light" | "dark") {
  let theme = createTheme({
    palette: {
      mode,
      background: {
        default: mode === "dark" ? "#0B0F17" : "#F6F7FB",
        paper: mode === "dark" ? "#111827" : "#FFFFFF",
      },
    },
    shape: { borderRadius: 18 },
    typography: {
      fontFamily: [
        "system-ui",
        "-apple-system",
        "Segoe UI",
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
      ].join(","),
      h4: { fontWeight: 900, letterSpacing: -0.6 },
      h5: { fontWeight: 900, letterSpacing: -0.4 },
      h6: { fontWeight: 800, letterSpacing: -0.2 },
      body1: { fontSize: "1.05rem", lineHeight: 1.55 },
      body2: { fontSize: "0.98rem", lineHeight: 1.5 },
      button: { textTransform: "none", fontWeight: 800 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            // melhora “cara de app” no mobile
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            // safe-area global (notch/top & barra de baixo)
            paddingTop: "calc(env(safe-area-inset-top) + 16px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            paddingTop: 14,
            paddingBottom: 14,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 22,
            boxShadow:
              mode === "dark"
                ? "0 10px 30px rgba(0,0,0,0.45)"
                : "0 12px 34px rgba(20,20,40,0.10)",
          },
        },
      },
      MuiAlert: { styleOverrides: { root: { borderRadius: 18 } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 999 } } },
    },
  });

  theme = responsiveFontSizes(theme);
  return theme;
}
