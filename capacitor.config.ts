import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.raferbati.entendaodocumento',
  appName: 'Entenda o Documento',
  webDir: 'out',
  server: {
    // For development, point to localhost. For production, update to deployed URL
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
    webContentsDebuggingEnabled: false,
  },
};

export default config;
