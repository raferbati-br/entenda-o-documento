import type { CapacitorConfig } from '@capacitor/cli';

const capacitorConfig: Partial<CapacitorConfig> = {
  appId: 'br.raferbati.entendaodocumento',
  appName: 'Entenda o Documento',
  webDir: 'www', // Define o diretório para build web
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'http://localhost:3000',
    cleartext: true, // Permite conexões HTTP em desenvolvimento
  },
  plugins: {
    Keyboard: { resize: 'native' }, // Resolve o problema da barra do teclado no iOS
  },
};

export default capacitorConfig;
