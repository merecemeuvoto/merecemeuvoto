#!/usr/bin/env python3
"""Trava de conteúdo do ¿Merece Meu Voto?: valida dados/fatos.json.

Um script só, rodando no hook pre-commit, na Action validar.yml e na linha de comando; toda
reprovação cita a regra violada.

Só biblioteca padrão. Python 3.11 ou superior.

Uso:
  python3 scripts/validar_dados.py                 # valida a pasta dados/ do repositório
  python3 scripts/validar_dados.py --raiz <pasta>  # valida outra raiz (testes usam fixtures)

Saída: 0 quando tudo passa; 1 com a lista de reprovações.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

RE_ID = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
RE_DATA = re.compile(r"^\d{4}-\d{2}(-\d{2})?$")
RE_DIA = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIPOS = {"feito", "promessa", "posicao", "dado"}
# beta = buscado e revisado por IA, no ar com o carimbo e sem conferência humana (convenções, seção 6).
STATUS = {"rascunho", "beta", "publicado", "retirado"}
NO_AR = {"beta", "publicado"}
CAMPOS_OBRIGATORIOS = ["id", "candidato", "tema", "tipo", "afirmacao", "data", "fontes", "status", "atualizado_em"]
CAMPOS_PERMITIDOS = set(CAMPOS_OBRIGATORIOS) | {
    "contexto", "nota_interna", "conferido_por", "conferido_em",
    "ordem", "etiqueta", "tags", "revisado_por", "buscado_em",
}
# Conferência humana (convenções, seção 6): fato publicado diz quem o conferiu na fonte e quando.
CAMPOS_CONFERENCIA = ("conferido_por", "conferido_em")
CAMPOS_FONTE = {"titulo", "url", "veiculo", "acessado_em"}
CAMPOS_FONTE_PERMITIDOS = CAMPOS_FONTE | {"primaria", "anonimo"}
RE_TAG = RE_ID
TAMANHO_AFIRMACAO = (20, 800)
TAMANHO_CONTEXTO = 600
TAMANHO_ETIQUETA = 40

# Neutralidade: palavras que pedem voto ou qualificam o candidato não entram em
# afirmacao nem em contexto. A lista é mínima de propósito — reprova o óbvio; o resto é revisão.
PALAVRAS_VEDADAS = [
    r"\bvote\b", r"\bvotem\b", r"\bvotar em\b", r"\bnão vote\b",
    r"\bmelhor candidato\b", r"\bpior candidato\b", r"\bmentiroso\b", r"\bmentira\b",
    r"\bcorrupto\b", r"\bladrão\b", r"\bgenocida\b", r"\bfascista\b", r"\bcomunista\b",
    r"\bmerece seu voto\b", r"\bmerece o seu voto\b",
]
RE_VEDADAS = [re.compile(p, re.IGNORECASE) for p in PALAVRAS_VEDADAS]


def carregar_json(caminho: Path, erros: list[str]):
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except FileNotFoundError:
        erros.append(f"{caminho}: arquivo ausente (esquema)")
    except json.JSONDecodeError as e:
        erros.append(f"{caminho}: JSON inválido — {e} (esquema)")
    return None


def data_valida(texto: str, so_dia: bool = False) -> bool:
    padrao = RE_DIA if so_dia else RE_DATA
    if not padrao.match(texto):
        return False
    partes = [int(p) for p in texto.split("-")]
    try:
        if len(partes) == 3:
            date(partes[0], partes[1], partes[2])
        else:
            date(partes[0], partes[1], 1)
    except ValueError:
        return False
    return True


def validar_fato(fato, i: int, candidatos: dict, temas: dict, hoje: date, erros: list[str]) -> str | None:
    rotulo = f"fatos[{i}]"
    if not isinstance(fato, dict):
        erros.append(f"{rotulo}: cada fato é um objeto (esquema)")
        return None
    fid = fato.get("id")
    if isinstance(fid, str) and fid:
        rotulo = f"fato {fid}"

    for campo in CAMPOS_OBRIGATORIOS:
        if campo not in fato:
            erros.append(f"{rotulo}: falta o campo obrigatório «{campo}» (esquema)")
    for campo in fato:
        if campo not in CAMPOS_PERMITIDOS:
            erros.append(f"{rotulo}: campo desconhecido «{campo}» — o esquema é fechado (esquema)")

    if not isinstance(fid, str) or not RE_ID.match(fid):
        erros.append(f"{rotulo}: id precisa ser slug minúsculo-com-hifens (esquema)")
    if fato.get("candidato") not in candidatos:
        erros.append(f"{rotulo}: candidato «{fato.get('candidato')}» não existe em candidatos.json (esquema)")
    if fato.get("tema") not in temas:
        erros.append(f"{rotulo}: tema «{fato.get('tema')}» não existe em temas.json (esquema)")
    if fato.get("tipo") not in TIPOS:
        erros.append(f"{rotulo}: tipo «{fato.get('tipo')}» fora de {sorted(TIPOS)} (esquema)")
    if fato.get("status") not in STATUS:
        erros.append(f"{rotulo}: status «{fato.get('status')}» fora de {sorted(STATUS)} (esquema)")

    afirmacao = fato.get("afirmacao")
    minimo, maximo = TAMANHO_AFIRMACAO
    if not isinstance(afirmacao, str) or not (minimo <= len(afirmacao) <= maximo):
        erros.append(f"{rotulo}: afirmacao precisa ter entre {minimo} e {maximo} caracteres (esquema)")
    contexto = fato.get("contexto", "")
    if contexto and (not isinstance(contexto, str) or len(contexto) > TAMANHO_CONTEXTO):
        erros.append(f"{rotulo}: contexto é texto de até {TAMANHO_CONTEXTO} caracteres (esquema)")
    for texto, nome in ((afirmacao, "afirmacao"), (contexto, "contexto")):
        if isinstance(texto, str):
            for padrao in RE_VEDADAS:
                if padrao.search(texto):
                    erros.append(f"{rotulo}: «{nome}» contém expressão vedada «{padrao.pattern}» — pedido de voto ou qualificação do candidato (neutralidade)")

    etiqueta = fato.get("etiqueta")
    if "etiqueta" in fato and (not isinstance(etiqueta, str) or not (1 <= len(etiqueta) <= TAMANHO_ETIQUETA)):
        erros.append(f"{rotulo}: etiqueta é texto curto de até {TAMANHO_ETIQUETA} caracteres (esquema)")
    tags = fato.get("tags")
    if "tags" in fato and (not isinstance(tags, list) or not all(isinstance(t, str) and RE_TAG.match(t) for t in tags)):
        erros.append(f"{rotulo}: tags é lista de slugs minúsculos-com-hifens (esquema)")
    ordem = fato.get("ordem")
    if "ordem" in fato and (not isinstance(ordem, int) or isinstance(ordem, bool) or ordem < 1):
        erros.append(f"{rotulo}: ordem é inteiro a partir de 1 (esquema)")

    data_fato = fato.get("data")
    if not isinstance(data_fato, str) or not data_valida(data_fato):
        erros.append(f"{rotulo}: data precisa ser AAAA-MM ou AAAA-MM-DD válida (esquema)")
    atualizado = fato.get("atualizado_em")
    if not isinstance(atualizado, str) or not data_valida(atualizado, so_dia=True):
        erros.append(f"{rotulo}: atualizado_em precisa ser AAAA-MM-DD válida (esquema)")
    elif date.fromisoformat(atualizado) > hoje:
        erros.append(f"{rotulo}: atualizado_em no futuro (esquema)")

    fontes = fato.get("fontes")
    if not isinstance(fontes, list) or not fontes:
        erros.append(f"{rotulo}: fato sem fonte não existe — fontes precisa ter ao menos um item (fontes)")
    else:
        for j, fonte in enumerate(fontes):
            rf = f"{rotulo}, fonte[{j}]"
            if not isinstance(fonte, dict):
                erros.append(f"{rf}: cada fonte é um objeto (fontes)")
                continue
            for campo in CAMPOS_FONTE:
                if campo not in fonte:
                    erros.append(f"{rf}: falta «{campo}» (fontes)")
            for campo in fonte:
                if campo not in CAMPOS_FONTE_PERMITIDOS:
                    erros.append(f"{rf}: campo desconhecido «{campo}» (fontes)")
            url = fonte.get("url", "")
            if not isinstance(url, str) or not url.startswith("https://"):
                erros.append(f"{rf}: url precisa começar com https:// (fontes)")
            acessado = fonte.get("acessado_em", "")
            if not isinstance(acessado, str) or not data_valida(acessado, so_dia=True):
                erros.append(f"{rf}: acessado_em precisa ser AAAA-MM-DD válida (fontes)")
            elif date.fromisoformat(acessado) > hoje:
                erros.append(f"{rf}: acessado_em no futuro (fontes)")
            if "primaria" in fonte and not isinstance(fonte["primaria"], bool):
                erros.append(f"{rf}: primaria é booleano (fontes)")
            if "anonimo" in fonte and (not isinstance(fonte["anonimo"], str) or len(fonte["anonimo"]) < 5):
                erros.append(f"{rf}: anonimo é o título da fonte sem nome de candidato, com 5 caracteres ou mais (fontes)")
        # Régua do que vai ao ar (convenções, seção 6): fonte primária, ou dois veículos independentes.
        if fato.get("status") in NO_AR:
            objetos = [f for f in fontes if isinstance(f, dict)]
            primaria = any(f.get("primaria") is True for f in objetos)
            veiculos = {str(f.get("veiculo", "")).strip().lower() for f in objetos if f.get("veiculo")}
            if not primaria and len(veiculos) < 2:
                erros.append(f"{rotulo}: fato no ar precisa de fonte primária ou de dois veículos independentes (fontes)")

    conferido_por = fato.get("conferido_por")
    if "conferido_por" in fato and (not isinstance(conferido_por, str) or not conferido_por.strip()):
        erros.append(f"{rotulo}: conferido_por é o nome de quem conferiu (conferência)")
    conferido_em = fato.get("conferido_em")
    if "conferido_em" in fato:
        if not isinstance(conferido_em, str) or not data_valida(conferido_em, so_dia=True):
            erros.append(f"{rotulo}: conferido_em precisa ser AAAA-MM-DD válida (conferência)")
        elif date.fromisoformat(conferido_em) > hoje:
            erros.append(f"{rotulo}: conferido_em no futuro (conferência)")
        elif isinstance(atualizado, str) and data_valida(atualizado, so_dia=True) and conferido_em < atualizado:
            erros.append(f"{rotulo}: conferido_em antes de atualizado_em — a conferência vale para o texto atual (conferência)")
    if fato.get("status") == "publicado":
        for campo in CAMPOS_CONFERENCIA:
            if campo not in fato:
                erros.append(f"{rotulo}: fato publicado sem «{campo}» — só vai ao ar conferido por uma pessoa (conferência)")

    # Beta (convenções, seção 6): buscado e revisado por IA, com a data da busca; conferido vira publicado.
    revisado_por = fato.get("revisado_por")
    if "revisado_por" in fato and (not isinstance(revisado_por, str) or not revisado_por.strip()):
        erros.append(f"{rotulo}: revisado_por é texto («ia» no beta) (beta)")
    buscado_em = fato.get("buscado_em")
    if "buscado_em" in fato:
        if not isinstance(buscado_em, str) or not data_valida(buscado_em, so_dia=True):
            erros.append(f"{rotulo}: buscado_em precisa ser AAAA-MM-DD válida (beta)")
        elif date.fromisoformat(buscado_em) > hoje:
            erros.append(f"{rotulo}: buscado_em no futuro (beta)")
    if fato.get("status") == "beta":
        if "buscado_em" not in fato:
            erros.append(f"{rotulo}: fato beta sem «buscado_em» — o carimbo mostra quando a IA buscou (beta)")
        if revisado_por != "ia":
            erros.append(f"{rotulo}: fato beta leva «revisado_por»: «ia» — o leitor vê que ninguém conferiu ainda (beta)")
        for campo in CAMPOS_CONFERENCIA:
            if campo in fato:
                erros.append(f"{rotulo}: fato beta com «{campo}» — conferido por uma pessoa, o status é publicado (beta)")

    # Leitura às cegas (convenções, seção 7): o texto no ar não entrega de quem se fala.
    if fato.get("status") in NO_AR:
        textos = [(afirmacao, "afirmacao"), (contexto, "contexto")]
        if isinstance(fontes, list):
            textos += [(f.get("anonimo"), f"fonte[{j}].anonimo") for j, f in enumerate(fontes) if isinstance(f, dict)]
        for texto, nome in textos:
            if not isinstance(texto, str):
                continue
            for chave, cand in candidatos.items():
                for palavra in nomes_reveladores(cand):
                    if re.search(rf"(?<![\w-]){re.escape(palavra)}(?![\w-])", texto, re.IGNORECASE):
                        erros.append(f"{rotulo}: «{nome}» cita «{palavra}», que entrega a candidatura {chave} na leitura às cegas (neutralidade)")

    if fato.get("status") in NO_AR and isinstance(fid, str) and fid.startswith("exemplo-"):
        erros.append(f"{rotulo}: registro de exemplo não pode ir ao ar (esquema)")
    return fid if isinstance(fid, str) else None


def nomes_reveladores(cand) -> list[str]:
    """Palavras do nome e o partido do candidato, com quatro letras ou mais (o número e siglas curtas dão falso positivo)."""
    if not isinstance(cand, dict):
        return []
    palavras = re.findall(r"[^\W\d_]+", str(cand.get("nome", "")))
    palavras += [str(cand.get("partido", ""))]
    return [p for p in palavras if len(p) >= 4]


def validar(raiz: Path, hoje: date | None = None) -> list[str]:
    hoje = hoje or date.today()
    erros: list[str] = []
    candidatos = carregar_json(raiz / "candidatos.json", erros) or {}
    temas = carregar_json(raiz / "temas.json", erros) or {}
    fatos = carregar_json(raiz / "fatos.json", erros)
    candidatos = {k: v for k, v in candidatos.items() if not k.startswith("_")}
    temas = {k: v for k, v in temas.items() if not k.startswith("_")}

    for chave, cand in candidatos.items():
        for campo in ("nome", "numero", "partido"):
            if not isinstance(cand, dict) or not cand.get(campo):
                erros.append(f"candidatos.json: «{chave}» sem «{campo}» (esquema)")
    for chave, tema in temas.items():
        if not isinstance(tema, dict) or not tema.get("rotulo"):
            erros.append(f"temas.json: «{chave}» sem «rotulo» (esquema)")

    if fatos is None:
        return erros
    if not isinstance(fatos, list):
        erros.append("fatos.json: a raiz precisa ser uma lista (esquema)")
        return erros

    vistos: dict[str, int] = {}
    for i, fato in enumerate(fatos):
        fid = validar_fato(fato, i, candidatos, temas, hoje, erros)
        if fid:
            if fid in vistos:
                erros.append(f"fato {fid}: id repetido (também em fatos[{vistos[fid]}]) (esquema)")
            vistos[fid] = i
    return erros


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--raiz", default=None, help="pasta com fatos.json, candidatos.json e temas.json (padrão: dados/ do repositório)")
    args = parser.parse_args(argv)
    raiz = Path(args.raiz) if args.raiz else Path(__file__).resolve().parent.parent / "dados"
    erros = validar(raiz)
    if erros:
        print(f"validar_dados: {len(erros)} reprovação(ões) em {raiz}")
        for e in erros:
            print(f"  - {e}")
        return 1
    print(f"validar_dados: ok — {raiz}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
