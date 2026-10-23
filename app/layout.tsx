import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { temasComparados } from "@/lib/fatos";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Bitter variável, servida do próprio site: sem chamada ao Google Fonts (privacidade e LGPD).
const bitter = localFont({
  src: "./fonts/Bitter-variable.ttf",
  variable: "--fonte-bitter",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "¿Merece Meu Voto? — A pausa antes do voto.",
    template: "%s · ¿Merece Meu Voto?",
  },
  description:
    "Os planos e o histórico dos dois finalistas lado a lado, às cegas, com a fonte em cada trecho. Sem dizer em quem votar.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "¿Merece Meu Voto?",
    title: "¿Merece Meu Voto? — A pausa antes do voto.",
    description:
      "Os planos e o histórico dos dois finalistas lado a lado, às cegas, com a fonte em cada trecho. Sem dizer em quem votar.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Antes de decidir, uma pausa." }],
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [{ url: "/favicon.png", sizes: "64x64", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F1E7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={bitter.variable}>
      <body>
        {children}
        <footer>
          <span>merecemeuvoto.com.br</span>
          <span>
            {temasComparados().length > 0 ? "" : "em construção · "}2º turno · 25/out/2026
          </span>
          <span className="lema-rodape">Ninguém chega aqui errado; chega com mais a descobrir.</span>
        </footer>
      </body>
    </html>
  );
}
