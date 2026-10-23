// Os cadernos do comparador: a apresentação de cada tema (cor, ícone, ordem na estante) e os
// contadores de cada grupo. O conteúdo vem de dados/ (lib/fatos.ts); isto é só a forma. A função
// dadosDoComparador() monta o objeto que public/comparador/logica.js lê na tela.
import { candidatos, chavesDeCandidatos, fatosNoAr, temas, type FatoPublico } from "@/lib/fatos";

export interface Contador {
  tag: string;
  /** [singular, plural] */
  nome: [string, string];
  icone: string;
  dica: string;
}

export const CONTADORES_PLANO: Contador[] = [
  { tag: "promessa", nome: ["promessa", "promessas"], icone: "i-promessa", dica: "Trechos em que o plano diz o que pretende fazer." },
  { tag: "afirmacao", nome: ["afirmação do plano", "afirmações do plano"], icone: "i-afirmacao", dica: "Trechos em que o plano afirma algo sobre o mandato atual ou sobre o país; a afirmação é do documento, e precisa de conferência própria." },
  { tag: "posicao", nome: ["posição", "posições"], icone: "i-posicao", dica: "Trechos em que o plano toma posição sem prometer uma ação concreta." },
  { tag: "numero", nome: ["com número", "com número"], icone: "i-numero", dica: "Trechos que trazem meta ou valor numérico (percentual, quantidade, dinheiro)." },
];

export const CONTADORES_JUSTICA: Contador[] = [
  { tag: "investigacao", nome: ["investigação", "investigações"], icone: "i-investigacao", dica: "Trechos que registram uma investigação formal aberta por órgão de controle, Ministério Público ou polícia." },
  { tag: "denuncia", nome: ["denúncia", "denúncias"], icone: "i-denuncia", dica: "Trechos que registram uma acusação formal do Ministério Público. Denúncia não é condenação." },
  { tag: "condenacao", nome: ["condenação", "condenações"], icone: "i-condenacao", dica: "Trechos que registram condenação por um juízo ou tribunal, mesmo que depois anulada." },
  { tag: "absolvicao", nome: ["absolvição", "absolvições"], icone: "i-absolvicao", dica: "Trechos que registram absolvição: o juízo examinou a acusação no mérito e a rejeitou." },
  { tag: "anulacao", nome: ["anulação", "anulações"], icone: "i-anulacao", dica: "Trechos que registram anulação de provas, de atos ou de decisões por tribunal superior." },
  { tag: "arquivamento", nome: ["arquivamento", "arquivamentos"], icone: "i-arquivamento", dica: "Trechos que registram arquivamento de denúncia ou de ação. Arquivamento não é absolvição: o mérito não foi julgado." },
  { tag: "tramite", nome: ["em trâmite", "em trâmite"], icone: "i-tramite", dica: "Trechos que registram ação ou investigação em andamento na data da fonte." },
];

export const GRUPOS = [
  { chave: "plano", titulo: "Plano de governo", curto: "Plano" },
  { chave: "historico", titulo: "Histórico pessoal", curto: "Histórico" },
] as const;

/** A estante: a ordem dos cadernos e a cara de cada um. Tema sem entrada aqui não vira caderno. */
const ESTANTE: { chave: string; cor: string; icone: string; contadores: Contador[] }[] = [
  { chave: "economia", cor: "#8A6A1E", icone: "i-economia", contadores: CONTADORES_PLANO },
  { chave: "saude", cor: "#4F6B3A", icone: "i-saude", contadores: CONTADORES_PLANO },
  { chave: "educacao", cor: "#3F5A78", icone: "i-educacao", contadores: CONTADORES_PLANO },
  { chave: "seguranca", cor: "#8C3B2E", icone: "i-seguranca", contadores: CONTADORES_PLANO },
  { chave: "meio-ambiente", cor: "#3E7A4E", icone: "i-meio-ambiente", contadores: CONTADORES_PLANO },
  { chave: "geopolitica", cor: "#355E7A", icone: "i-geopolitica", contadores: CONTADORES_PLANO },
  { chave: "justica", cor: "#5E3A5C", icone: "i-justica", contadores: CONTADORES_JUSTICA },
  { chave: "trabalho", cor: "#2E6A64", icone: "i-trabalho", contadores: [] },
  { chave: "falas", cor: "#8E3F6A", icone: "i-falas", contadores: [] },
  { chave: "relacoes", cor: "#4F5A6E", icone: "i-relacoes", contadores: [] },
];

export interface CadernoNaTela {
  chave: string;
  titulo: string;
  cor: string;
  icone: string;
  contadores: Contador[];
  plano: boolean;
  grupo: "plano" | "historico";
  nota?: string;
}

export interface TrechoNaTela {
  id: string;
  candidato: string;
  tema: string;
  ordem: number;
  /** Rótulo mostrado no trecho (promessa, afirmação do plano, denúncia…). */
  tipo: string;
  tags: string[];
  afirmacao: string;
  contexto?: string;
  fontes: { titulo: string; anonimo?: string; url: string; veiculo: string }[];
  /** Dia em que a IA buscou o trecho (beta) ou em que uma pessoa o conferiu (publicado). */
  buscado: string;
  conferido?: { por: string; em: string };
}

export interface DadosDoComparador {
  candidaturas: Record<string, { nome: string; partido: string; numero: number; foto: string }>;
  grupos: typeof GRUPOS;
  temas: CadernoNaTela[];
  trechos: TrechoNaTela[];
}

const ETIQUETA_POR_TIPO: Record<string, string> = { feito: "feito", promessa: "promessa", posicao: "posição", dado: "número" };

function trechoNaTela(f: FatoPublico): TrechoNaTela {
  const n = Number(f.id.split("-").pop());
  return {
    id: f.id,
    candidato: f.candidato,
    tema: f.tema,
    ordem: f.ordem ?? (Number.isFinite(n) ? n : 0),
    tipo: f.etiqueta ?? ETIQUETA_POR_TIPO[f.tipo] ?? f.tipo,
    tags: f.tags ?? [f.tipo],
    afirmacao: f.afirmacao,
    contexto: f.contexto,
    fontes: f.fontes.map(({ titulo, anonimo, url, veiculo }) => ({ titulo, anonimo, url, veiculo })),
    buscado: f.buscado_em ?? f.conferido_em ?? f.atualizado_em,
    conferido: f.conferido_por && f.conferido_em ? { por: f.conferido_por, em: f.conferido_em } : undefined,
  };
}

/** O que a tela recebe: candidaturas, grupos, cadernos (com os vazios e sua nota) e os trechos no ar. */
export function dadosDoComparador(): DadosDoComparador {
  const candidaturas = Object.fromEntries(
    chavesDeCandidatos().flatMap((c) => {
      const cand = candidatos[c];
      if (!cand) return [];
      return [[c, { nome: cand.nome, partido: cand.partido, numero: Number(cand.numero), foto: `/fotos/${c}.jpg` }] as const];
    }),
  );
  const cadernos: CadernoNaTela[] = ESTANTE.flatMap(({ chave, cor, icone, contadores }) => {
    const tema = temas[chave];
    if (!tema) return [];
    const grupo = tema.grupo ?? "plano";
    return [{ chave, titulo: tema.rotulo, cor, icone, contadores, plano: grupo === "plano", grupo, nota: tema.nota }];
  });
  const naEstante = new Set(cadernos.map((c) => c.chave));
  return {
    candidaturas,
    grupos: GRUPOS,
    temas: cadernos,
    trechos: fatosNoAr().filter((f) => naEstante.has(f.tema)).map(trechoNaTela),
  };
}
