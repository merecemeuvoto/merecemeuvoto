import type { MetadataRoute } from "next";
import { RESPONSAVEL } from "@/lib/responsavel";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const rotas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
  ];
  if (RESPONSAVEL) {
    rotas.push({ url: `${SITE_URL}/quem-faz`, changeFrequency: "monthly", priority: 0.3 });
  }
  return rotas;
}
