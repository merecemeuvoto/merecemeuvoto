import { dataPorExtenso } from "@/lib/datas";

// O carimbo BETA: tinta de escritório no alto da página, torto de propósito. Diz, ao toque ou ao
// passar o mouse, que os trechos no ar foram buscados e revisados por IA e ainda não conferidos por
// uma pessoa — e o que muda quando a conferência acontece (convenções, seção 6).
export function Carimbo({ beta, buscadoEm, email }: { beta: number; buscadoEm: string | null; email?: string }) {
  const resumo = `Versão beta: ${beta} trechos buscados e revisados por inteligência artificial, com a fonte em cada um, ainda sem conferência humana. Toque para saber mais.`;
  return (
    <details className="carimbo">
      <summary title={resumo} aria-label={resumo}>
        Beta
      </summary>
      <div className="nota-carimbo" role="note">
        <p>
          <b>Versão beta.</b> Os {beta} trechos no ar foram buscados e revisados por inteligência
          artificial, a partir da fonte indicada em cada um, e ainda não foram conferidos por uma
          pessoa. Por isso o carimbo.
        </p>
        <p>
          A conferência humana vem em seguida: conferido na fonte, cada trecho ganha a marca de quem
          conferiu e quando, e o ponto laranja dele sai. Enquanto isso, cada fonte está a um toque
          de distância para você mesmo conferir.
        </p>
        <p>
          {buscadoEm ? `Última busca em ${dataPorExtenso(buscadoEm)}.` : null}
          {email ? (
            <>
              {" "}
              ¿Achou um erro? Escreva com a fonte: <a href={`mailto:${email}`}>{email}</a>.
            </>
          ) : null}
        </p>
      </div>
    </details>
  );
}
