// Camada de dados da fase 1: lê dados/*.json em tempo de build. A validação de conteúdo
// (fonte, neutralidade, esquema) é do scripts/validar_dados.py; aqui só tipos e filtros.
import candidatosJson from "@/dados/candidatos.json";
import fatosJson from "@/dados/fatos.json";
import temasJson from "@/dados/temas.json";

export type TipoDeFato = "feito" | "promessa" | "posicao" | "dado";
export type StatusDeFato = "rascunho" | "publicado" | "retirado";

export interface Fonte {
  titulo: string;
  url: string;
  veiculo: string;
  acessado_em: string;
  primaria?: boolean;
}

export interface Fato {
  id: string;
  candidato: string;
  tema: string;
  tipo: TipoDeFato;
  afirmacao: string;
  contexto?: string;
  data: string;
  fontes: Fonte[];
  status: StatusDeFato;
  atualizado_em: string;
  nota_interna?: string;
}

export interface Candidato {
  nome: string;
  numero: string;
  partido: string;
  fonte_registro?: string;
}

export interface Tema {
  rotulo: string;
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

/** Só o que vai para o site: publicado, sem a nota interna. */
export function fatosPublicados(): Omit<Fato, "nota_interna">[] {
  return fatos
    .filter((f) => f.status === "publicado")
    .map((f) => {
      const copia = { ...f };
      delete copia.nota_interna;
      return copia;
    });
}

/** Ordem de exibição dos candidatos: alfabética pela chave, nunca por preferência. */
export function chavesDeCandidatos(): string[] {
  return Object.keys(candidatos).sort();
}
