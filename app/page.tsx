import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { Anel } from "@/components/Anel";
import { Carimbo } from "@/components/Carimbo";
import { Marca } from "@/components/Marca";
import { dadosDoComparador } from "@/lib/cadernos";
import { contagemDoBeta, temasComparados } from "@/lib/fatos";
import { RESPONSAVEL } from "@/lib/responsavel";
import { version } from "@/package.json";
import "./comparador.css";

// O comparador por cadernos é HTML e JavaScript sem dependência (public/comparador/logica.js), vindo
// do estudo em docs/simulacoes: a página serve o fragmento com o envelope, a régua e o placar, e os
// dados montados em tempo de build a partir de dados/ (lib/cadernos.ts). Lido no build, uma vez.
const FRAGMENTO = fs.readFileSync(
  path.join(process.cwd(), "components", "comparador", "fragmento.html"),
  "utf8",
);

// A página abre com o comparador quando há ao menos um tema com trecho no ar para todos os
// candidatos; sem isso, segue a página «em construção» da fase 0.
export default function Inicio() {
  const abertos = temasComparados().length > 0;
  const dados = dadosDoComparador();
  const contagem = contagemDoBeta();
  const primeiro = dados.temas.find((t) => dados.trechos.some((x) => x.tema === t.chave));
  // JSON dentro de <script>: «<» escapado para nenhum texto de fonte fechar a tag.
  const json = JSON.stringify(dados).replace(/</g, "\\u003c");

  const acompanhe = (
    <div className="status">
      {abertos ? null : <strong>Em construção</strong>}
      {abertos ? "Acompanhe em " : "Abre antes do 2º turno de 25 de outubro de 2026. Acompanhe em "}
      <a href="https://www.instagram.com/merecemeuvoto">@merecemeuvoto</a>
      {RESPONSAVEL ? (
        <>
          {" "}
          · <Link href="/quem-faz">quem faz</Link>
        </>
      ) : null}
      .
    </div>
  );

  if (!abertos || !primeiro) {
    return (
      <main>
        <Anel />
        <Marca />
        <h1>
          Antes de decidir, <span>uma pausa.</span>
        </h1>
        <p>
          Fatos dos dois finalistas do 2º turno lado a lado, com a fonte em cada trecho. Sem dizer
          em quem votar: a gente organiza, você decide.
        </p>
        {acompanhe}
      </main>
    );
  }

  return (
    <main className="largo">
      <header className="topo">
        <Marca />
        <Carimbo beta={contagem.beta} buscadoEm={contagem.buscadoEm} email={RESPONSAVEL?.email} />
      </header>

      <section className="capa folha-mesa" aria-labelledby="capa-titulo">
        <h1 id="capa-titulo">
          Antes de decidir, <span>uma pausa.</span>
        </h1>
        <p>Compare as duas candidaturas às cegas, tema por tema, com a fonte em cada trecho. Você decide.</p>
        <a className="acao cheia" href="#envelope">
          Começar pela {primeiro.titulo}
          <span className="seta" />
        </a>
      </section>

      <div dangerouslySetInnerHTML={{ __html: FRAGMENTO }} />
      <script id="mmv-dados" type="application/json" dangerouslySetInnerHTML={{ __html: json }} />
      <script src={`/comparador/logica.js?v=${version}`} defer />

      {acompanhe}
    </main>
  );
}
