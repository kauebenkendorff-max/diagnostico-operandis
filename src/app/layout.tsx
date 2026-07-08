import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diagnóstico Operandis",
  description:
    "Descubra o nível de maturidade da sua empresa em Segurança do Trabalho, Saúde Ocupacional, Gestão de Riscos e Fatores Psicossociais.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
