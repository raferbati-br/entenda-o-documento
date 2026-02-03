import "./globals.css";
import type { Metadata, Viewport } from "next"; // Importe Viewport
import { Suspense } from "react";
import Providers from "./providers";
import { UI_TEXTS } from "@/lib/constants";

export const metadata: Metadata = {
  title: UI_TEXTS.APP_TITLE,
  description: UI_TEXTS.APP_DESCRIPTION,
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
  maximumScale: 5, // Allow zoom for accessibility (WCAG 2.1 AA requirement)
  userScalable: true, // Allow pinch zoom for accessibility
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
