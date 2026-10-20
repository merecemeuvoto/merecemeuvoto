// Quem responde pelo site: nome civil e e-mail de contato do projeto (Lei 9.504/1997, art. 57-D).
// Se RESPONSAVEL voltar a null, /quem-faz responde 404 e some do início e do sitemap — o site
// nunca publica colchete de rascunho.
export interface Responsavel {
  /** Nome civil, como aparece na página. */
  nome: string;
  /** E-mail de contato do projeto. */
  email: string;
}

export const RESPONSAVEL: Responsavel | null = {
  nome: "Gabriel Albrecht Fitarelli",
  email: "merecemeuvoto@gmail.com",
};
