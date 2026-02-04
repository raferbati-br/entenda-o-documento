const capacitorConfig = {
  appId: 'br.raferbati.entendaodocumento',
  appName: 'Entenda o Documento',
  webDir: 'out',
  server: {
    // Development: uses localhost with HTTP
    // Production: set CAPACITOR_SERVER_URL to an HTTPS URL (e.g., https://your-domain.com)
    url: process.env.CAPACITOR_SERVER_URL || 'http://localhost:3000',
    cleartext: process.env.NODE_ENV === 'development',
    androidScheme: 'https',
    iosScheme: 'https',
  },
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
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
  },
};

export default capacitorConfig;
