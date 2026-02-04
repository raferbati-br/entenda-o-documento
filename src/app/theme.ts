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
        main: '#002952', // Very dark blue for sufficient contrast (8.4:1 ratio on white)
      },
      background: {
        // Unifica o fundo: No mobile moderno, evitamos o cinza claro de fundo de site.
        // Usamos branco total ou preto total.
        default: mode === "light" ? "#FFFFFF" : "#000000",
        paper: mode === "light" ? "#FFFFFF" : "#1C1C1E",
      },
      text: {
        primary: mode === "light" ? "#000000" : "#FFFFFF",
        secondary: mode === "light" ? "#000000" : "#98989F", // Use black to ensure sufficient contrast after MUI transforms
        disabled: mode === "light" ? "#262626" : "#757575", // Very dark to compensate for MUI alpha transforms
      },
      action: {
        disabled: mode === "light" ? "#262626" : "#757575", // Very dark for disabled elements
        disabledBackground: mode === "light" ? "#ECECEC" : "#2C2C2E",
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