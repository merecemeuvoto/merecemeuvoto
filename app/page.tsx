import Link from "next/link";
import { Anel } from "@/components/Anel";
import { Marca } from "@/components/Marca";
import { RESPONSAVEL } from "@/lib/responsavel";

// Fase 0: a página «em construção». A fase 1 troca este arquivo pelo comparador (lib/fatos.ts).
export default function Inicio() {
  return (
    <main>
      <Anel />
      <Marca />
      <h1>
        Antes de decidir, <span>uma pausa.</span>
      </h1>
      <p>
        Fatos dos dois finalistas do 2º turno lado a lado, com a fonte em cada card. Sem dizer em
        quem votar: a gente organiza, você decide.
      </p>
      <div className="status">
        <strong>Em construção</strong>
        Abre antes do 2º turno de 25 de outubro de 2026. Acompanhe em{" "}
        <a href="https://www.instagram.com/merecemeuvoto">@merecemeuvoto</a>
        {RESPONSAVEL ? (
          <>
            {" "}
            · <Link href="/quem-faz">quem faz</Link>
          </>
        ) : null}
        .
      </div>
    </main>
  );
}
