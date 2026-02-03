import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.raferbati.entendaodocumento',
  appName: 'Entenda o Documento',
  // NOTE: This `webDir` is a placeholder required by the Capacitor CLI (from `cap:init`).
  // In this project we use a hybrid architecture: the native WebView loads the remote
  // Next.js app from `server.url` (no `next export` / static `out` build in normal flow).
  // Do not rely on `out/` for app content; update `server.url` for the real backend URL.
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
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
  },
};

export default config;
