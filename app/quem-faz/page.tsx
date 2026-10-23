import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Marca } from "@/components/Marca";
import { RESPONSAVEL } from "@/lib/responsavel";

export const metadata: Metadata = {
  title: "Quem faz",
  description: "Quem faz o ¿Merece Meu Voto?, de que lugar fala e como entrar em contato.",
};

// Identificação do responsável (Lei 9.504/1997, art. 57-D).
// Sem RESPONSAVEL, a página não existe: notFound() em vez de colchetes.
export default function QuemFaz() {
  if (!RESPONSAVEL) notFound();
  const { nome, email } = RESPONSAVEL;

  return (
    <main>
      <Marca />
      <h1>Quem faz</h1>
      <p>Outubro de 2026, entre um café e outro.</p>
      <p>
        Designer, eleitor de esquerda, filiado à UP (Unidade Popular pelo Socialismo), e responsável
        por uma página de opinião, o Saldo da Gente: quem faz o ¿Merece Meu Voto? sou eu, {nome}.
      </p>
      <p>
        Conto tudo isso antes do primeiro trecho por um motivo simples: este site não pede que confiem
        em mim; pede que confiram a fonte.
      </p>
      <p>
        Cada trecho traz o link da fonte e a data em que ela foi consultada; as candidaturas aparecem
        como A e B, em posição sorteada a cada visita, até você pedir para ver quem é quem; e não há
        adjetivo, ranking, nem conselho de voto. Aqui eu organizo; quem decide é quem lê. ¿Achou um
        trecho errado, contra qualquer um dos dois? Me escreve com a fonte: se ela confirmar o erro,
        o trecho muda e mostra quando foi revisto.
      </p>
      <p>
        O Saldo da Gente é outra conversa, com lado assumido; aqui, a minha opinião fica do lado de
        fora (e, se ela escapar em algum trecho, quero saber). Os dois sites são iniciativa minha:
        nenhum partido pediu, paga, ou revisa o que sai aqui, nem a UP.
      </p>
      <p>
        Não há anúncio, doação, nem post impulsionado. O código, a pesquisa e a redação contam com
        ajuda de inteligência artificial (o Claude, da Anthropic). Nesta versão beta, os trechos no ar
        foram buscados e revisados pela IA, com a fonte em cada um, e ainda não foram conferidos por
        uma pessoa — o carimbo no alto da página e o ponto laranja em cada trecho dizem isso. A
        conferência humana vem em seguida: conferido na fonte, o trecho ganha a marca de quem conferiu
        e quando, e o ponto sai.
      </p>
      <p>Ninguém chega aqui errado; chega com mais a descobrir.</p>
      <p>
        Contato: <a href={`mailto:${email}`}>{email}</a>
      </p>
    </main>
  );
}
