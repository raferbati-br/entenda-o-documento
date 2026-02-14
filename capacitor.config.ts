const isDevelopment = process.env.NODE_ENV === 'development';
const configuredServerUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const capacitorConfig = {
  appId: 'br.raferbati.entendaodocumento',
  appName: 'Entenda o Documento',
  webDir: 'out',
  server: configuredServerUrl
    ? {
        // Production and staging: explicit remote URL (prefer HTTPS)
        url: configuredServerUrl,
        cleartext: configuredServerUrl.startsWith('http://'),
        androidScheme: 'https',
        iosScheme: 'https',
      }
    : isDevelopment
      ? {
          // Local development only
          url: 'http://10.0.2.2:3000',
          cleartext: true,
          androidScheme: 'https',
          iosScheme: 'https',
        }
      : undefined,
  plugins: {
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#FFFFFF',
    },
  },
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: isDevelopment,
  },
};

export default capacitorConfig;
