// Datas como o leitor lê: mês em letras. Fica fora de lib/fatos.ts de propósito, para o
// componente de cliente não importar os JSON de dados (e com eles a nota interna) no bundle.
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** AAAA-MM-DD → 23/out/2026; AAAA-MM → ago/2026. */
export function dataPorExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  const nomeDoMes = MESES[Number(mes) - 1] ?? mes;
  return dia ? `${dia}/${nomeDoMes}/${ano}` : `${nomeDoMes}/${ano}`;
}
