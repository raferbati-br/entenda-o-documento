import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Entenda o Documento",
  description: "Explicações simples para documentos burocráticos",
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
