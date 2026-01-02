import "./globals.css";
import type { Metadata, Viewport } from "next"; // Importe Viewport
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Entenda o Documento",
  description: "Explicações simples para documentos burocráticos",
  manifest: "/manifest.json", // Prepare para o futuro
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