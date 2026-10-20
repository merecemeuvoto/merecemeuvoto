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
        Conto tudo isso antes do primeiro card por um motivo simples: este site não pede que confiem
        em mim; pede que confiram a fonte.
      </p>
      <p>
        Cada card traz o link da fonte e a data em que ela foi consultada; os candidatos aparecem em
        ordem alfabética; e não há adjetivo, ranking, nem conselho de voto. Aqui eu organizo; quem
        decide é quem lê. ¿Achou um card errado, contra qualquer um dos dois? Me escreve com a
        fonte: se ela confirmar o erro, o card muda e mostra quando foi revisto.
      </p>
      <p>
        O Saldo da Gente é outra conversa, com lado assumido; aqui, a minha opinião fica do lado de
        fora (e, se ela escapar em algum card, quero saber). Os dois sites são iniciativa minha:
        nenhum partido pediu, paga, ou revisa o que sai aqui, nem a UP.
      </p>
      <p>
        Não há anúncio, doação, nem post impulsionado. O código, a pesquisa e a redação contam com
        ajuda de inteligência artificial (o Claude, da Anthropic); antes de ir ao ar, cada fato é
        conferido na fonte por uma pessoa, não pela máquina.
      </p>
      <p>Ninguém chega aqui errado; chega com mais a descobrir.</p>
      <p>
        Contato: <a href={`mailto:${email}`}>{email}</a>
      </p>
    </main>
  );
}
