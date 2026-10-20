import type { NextConfig } from "next";

// Cabeçalhos de segurança básicos para um site estático de fatos.
const cabecalhos = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Sem o AGENTS.md que o `next dev` cria ao detectar um agente de IA.
  agentRules: false,
  async headers() {
    return [{ source: "/(.*)", headers: cabecalhos }];
  },
};

export default nextConfig;
