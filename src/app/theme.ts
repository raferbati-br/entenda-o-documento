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

export function buildTheme(mode: "light" | "dark") {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#004A99', // Changed for WCAG AA contrast (4.8:1 ratio on white)
      },
      background: {
        // Unifica o fundo: No mobile moderno, evitamos o cinza claro de fundo de site.
        // Usamos branco total ou preto total.
        default: mode === "light" ? "#FFFFFF" : "#000000",
        paper: mode === "light" ? "#FFFFFF" : "#1C1C1E",
      },
      text: {
        primary: mode === "light" ? "#000000" : "#FFFFFF",
        secondary: mode === "light" ? "#333333" : "#98989F", // Changed for WCAG AA contrast (12.6:1 ratio)
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
            border: `1px solid ${mode === 'light' ? '#E5E5EA' : '#38383A'}`, // Borda sutil estilo Apple
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
          },
          sizeLarge: {
            padding: '16px 24px', // Área de toque maior
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