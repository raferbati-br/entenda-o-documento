import { createTheme } from "@mui/material/styles";

// Pilha de fontes nativa para máxima performance em celulares antigos
const SYSTEM_FONT_STACK = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(',');

export function buildTheme(mode: "light" | "dark", highContrast = false) {
  const effectiveMode = highContrast ? "dark" : mode;
  const backgroundDefault = highContrast ? "#000000" : mode === "light" ? "#FFFFFF" : "#000000";
  const backgroundPaper = highContrast ? "#000000" : mode === "light" ? "#FFFFFF" : "#1C1C1E";
  const textPrimary = highContrast ? "#FFFFFF" : mode === "light" ? "#000000" : "#FFFFFF";
  const textSecondary = highContrast ? "#F5F5F5" : mode === "light" ? "#1F1F1F" : "#B3B3B8";
  const textDisabled = highContrast ? "#BDBDBD" : mode === "light" ? "#2B2B2B" : "#8A8A8A";
  const borderColor = highContrast ? "#FFFFFF" : mode === "light" ? "#E5E5EA" : "#38383A";

  return createTheme({
    palette: {
      mode: effectiveMode,
      primary: {
        main: highContrast ? "#FFD54F" : "#002952", // High contrast highlight or brand blue
      },
      background: {
        // Unifica o fundo: No mobile moderno, evitamos o cinza claro de fundo de site.
        // Usamos branco total ou preto total.
        default: backgroundDefault,
        paper: backgroundPaper,
      },
      text: {
        primary: textPrimary,
        secondary: textSecondary, // Keep strong contrast in light mode
        disabled: textDisabled, // Dark enough for legibility
      },
      action: {
        disabled: textDisabled, // Keep accessible contrast
        disabledBackground: highContrast ? "#2C2C2E" : mode === "light" ? "#E0E0E0" : "#2C2C2E",
      },
    },

    typography: {
      fontFamily: SYSTEM_FONT_STACK,
      h4: {
        fontWeight: 800,
        letterSpacing: '-0.02em', // Aperta um pouco o título estilo iOS
      },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      button: {
        fontWeight: 600,
        textTransform: "none", // Remove o CAPS LOCK
        fontSize: "1.05rem", // Botões levemente maiores para o dedo
      },
      body1: {
        lineHeight: 1.5,
        fontSize: '1.05rem', // Leitura confortável
      },
      body2: {
        lineHeight: 1.4,
      },
    },

    shape: {
      borderRadius: 16,
    },

    components: {
      // Remove sombra de todos os cards e papers
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: 'none',
            border: `1px solid ${borderColor}`, // Borda sutil estilo Apple
          },
          elevation2: {
            boxShadow: 'none',
            border: 'none',
          },
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0, // Cards agora são flat por padrão
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999, // Formato de pílula (Padrão moderno)
            boxShadow: 'none',
            padding: '12px 24px',
            '&:active': {
              boxShadow: 'none',
              opacity: 0.7, // Feedback visual de toque instantâneo
            },
            '&:hover': {
              boxShadow: 'none',
            },
            '&.Mui-disabled': {
              // Improve contrast for disabled buttons
              color: mode === 'light' ? '#1F1F1F !important' : '#999999',
              backgroundColor: mode === 'light' ? '#F5F5F5 !important' : '#2C2C2E',
            },
          },
          sizeLarge: {
            padding: '16px 24px', // Área de toque maior
          },
          contained: {
            '&.Mui-disabled': {
              // Better contrast for disabled contained buttons
              color: mode === 'light' ? '#1F1F1F !important' : '#999999',
              backgroundColor: mode === 'light' ? '#DADADA !important' : '#2C2C2E',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 8,
          },
        },
      },
    },
  });
}
