import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";

export const metadata: Metadata = {
  title: "Pro Campanha - Gestão de Camapnha Inteligente",
  description: "Plataforma SaaS para gestão de campanhas eleitorais, gabinetes e operações políticas no Brasil.",
  keywords: "gestão política, campanha eleitoral, gabinete, SaaS, Brasil",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
