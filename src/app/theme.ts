import { createTheme } from "@mui/material/styles";

const RADIUS = 16;

/**
 * Cria o tema de acordo com o modo (light / dark)
 * Compatível com Providers.tsx
 */
export function buildTheme(mode: "light" | "dark") {
  return createTheme({
    palette: {
      mode,

      ...(mode === "light"
        ? {
            background: {
              default: "#F7F8FA",
              paper: "#FFFFFF",
            },
          }
        : {
            background: {
              default: "#0F1115",
              paper: "#161A22",
            },
          }),
    },

    typography: {
      fontFamily:
        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',

      h5: {
        fontWeight: 900,
      },

      h6: {
        fontWeight: 900,
      },

      button: {
        fontWeight: 800,
        textTransform: "none",
      },
    },

    shape: {
      borderRadius: RADIUS,
    },

    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS,
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS,
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS,
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS,
            fontWeight: 700,
          },
        },
      },

      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS,
          },
        },
      },
    },
  });
}
