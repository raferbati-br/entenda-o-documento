import "./globals.css";
import type { Metadata, Viewport } from "next"; // Importe Viewport
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Entenda o Documento",
  description: "Explicações simples para documentos burocráticos",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-192.png", // Ícone para iPhone/iPad
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // Ou "black-translucent" se quiser que o conteúdo passe por baixo da barra de status
    title: "Entenda",
  },
};

// Configuração CRUCIAL para parecer app nativo
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Impede zoom de pinça
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}