// Endereço público do site, sem barra final, para metadados, Open Graph, sitemap e robots.
// Ordem: NEXT_PUBLIC_SITE_URL, quando se quer fixar um domínio › o domínio de produção que o
// Vercel informa no build (VERCEL_PROJECT_PRODUCTION_URL, sem protocolo, o mesmo também nos
// previews) — merecemeuvoto.vercel.app até o domínio próprio entrar, e ele depois, sem mudar
// código › localhost no desenvolvimento.
function urlDoSite(): string {
  const explicita = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicita) return explicita.replace(/\/+$/, "");
  const producao = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (producao) return `https://${producao}`;
  return "http://localhost:3000";
}

export const SITE_URL = urlDoSite();
