import type { CapacitorConfig } from '@capacitor/cli';

// Environment configuration
const serverUrl = process.env.CAPACITOR_SERVER_URL || 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';

// Validate HTTPS in production
if (isProduction) {
  // Em produção, exigir URL HTTPS explícita para evitar tráfego em claro.
  if (!serverUrl.startsWith('https://')) {
    throw new Error(
      'CAPACITOR_SERVER_URL must be set to an HTTPS URL in production (for example, https://seu-dominio.com).',
    );
  }
}

const config: CapacitorConfig = {
  appId: 'br.raferbati.entendaodocumento',
  appName: 'Entenda o Documento',
  webDir: 'out',
  server: {
    // Desenvolvimento: usa localhost com HTTP.
    // Produção: defina CAPACITOR_SERVER_URL com uma URL HTTPS pública (obrigatório).
    url: serverUrl,
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
