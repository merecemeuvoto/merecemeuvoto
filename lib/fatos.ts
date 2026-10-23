// Camada de dados: lê dados/*.json em tempo de build. A validação de conteúdo (fonte, neutralidade,
// esquema, regras do beta) é do scripts/validar_dados.py; aqui só tipos e filtros.
import candidatosJson from "@/dados/candidatos.json";
import fatosJson from "@/dados/fatos.json";
import temasJson from "@/dados/temas.json";

export type TipoDeFato = "feito" | "promessa" | "posicao" | "dado";
/** beta = no ar com carimbo, buscado e revisado por IA, sem conferência humana (convenções, seção 6). */
export type StatusDeFato = "rascunho" | "beta" | "publicado" | "retirado";

export interface Fonte {
  titulo: string;
  url: string;
  veiculo: string;
  acessado_em: string;
  primaria?: boolean;
  /** Título sem nome de candidato, mostrado enquanto a leitura é às cegas. */
  anonimo?: string;
}

export interface Fato {
  id: string;
  candidato: string;
  tema: string;
  ordem?: number;
  tipo: TipoDeFato;
  etiqueta?: string;
  tags?: string[];
  afirmacao: string;
  contexto?: string;
  data: string;
  fontes: Fonte[];
  status: StatusDeFato;
  atualizado_em: string;
  revisado_por?: string;
  buscado_em?: string;
  conferido_por?: string;
  conferido_em?: string;
  nota_interna?: string;
}

export type FatoPublico = Omit<Fato, "nota_interna">;

export interface Candidato {
  nome: string;
  numero: string;
  partido: string;
  fonte_registro?: string;
}

export interface Tema {
  rotulo: string;
  grupo?: "plano" | "historico";
  nota?: string;
}

type Catalogo<T> = Record<string, T | string>;

function semNotas<T>(catalogo: Catalogo<T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(catalogo).filter(([chave]) => !chave.startsWith("_")),
  ) as Record<string, T>;
}

export const candidatos = semNotas<Candidato>(candidatosJson as Catalogo<Candidato>);
export const temas = semNotas<Tema>(temasJson as Catalogo<Tema>);
export const fatos = fatosJson as Fato[];

const NO_AR: StatusDeFato[] = ["beta", "publicado"];

/** Só o que vai para o site: beta ou publicado, sem a nota interna. */
export function fatosNoAr(): FatoPublico[] {
  return fatos
    .filter((f) => NO_AR.includes(f.status))
    .map((f) => {
      const copia = { ...f };
      delete copia.nota_interna;
      return copia;
    });
}

/** Ordem de referência dos candidatos: alfabética pela chave, nunca por preferência. A tela sorteia a
 *  posição A/B a cada visita (convenções, seção 7) — a partir desta lista, não de uma preferência. */
export function chavesDeCandidatos(): string[] {
  return Object.keys(candidatos).sort();
}

/** Temas que têm ao menos um trecho no ar para todos os candidatos — nenhum lado aparece sozinho. */
export function temasComparados(): string[] {
  const noAr = fatosNoAr();
  const chaves = chavesDeCandidatos();
  return Object.keys(temas).filter((tema) =>
    chaves.every((c) => noAr.some((f) => f.tema === tema && f.candidato === c)),
  );
}

/** O que o carimbo diz: quantos trechos estão no ar sem conferência humana e quantos já conferidos. */
export function contagemDoBeta(): { beta: number; publicados: number; buscadoEm: string | null } {
  const noAr = fatosNoAr();
  const beta = noAr.filter((f) => f.status === "beta");
  const datas = beta.map((f) => f.buscado_em).filter((d): d is string => !!d).sort();
  return {
    beta: beta.length,
    publicados: noAr.length - beta.length,
    buscadoEm: datas[datas.length - 1] ?? null,
  };
}
