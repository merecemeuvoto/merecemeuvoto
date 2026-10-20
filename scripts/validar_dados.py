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
STATUS = {"rascunho", "publicado", "retirado"}
CAMPOS_OBRIGATORIOS = ["id", "candidato", "tema", "tipo", "afirmacao", "data", "fontes", "status", "atualizado_em"]
CAMPOS_PERMITIDOS = set(CAMPOS_OBRIGATORIOS) | {"contexto", "nota_interna"}
CAMPOS_FONTE = {"titulo", "url", "veiculo", "acessado_em"}
CAMPOS_FONTE_PERMITIDOS = CAMPOS_FONTE | {"primaria"}

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
    if not isinstance(afirmacao, str) or not (20 <= len(afirmacao) <= 280):
        erros.append(f"{rotulo}: afirmacao precisa ter entre 20 e 280 caracteres (esquema)")
    contexto = fato.get("contexto", "")
    if contexto and (not isinstance(contexto, str) or len(contexto) > 600):
        erros.append(f"{rotulo}: contexto é texto de até 600 caracteres (esquema)")
    for texto, nome in ((afirmacao, "afirmacao"), (contexto, "contexto")):
        if isinstance(texto, str):
            for padrao in RE_VEDADAS:
                if padrao.search(texto):
                    erros.append(f"{rotulo}: «{nome}» contém expressão vedada «{padrao.pattern}» — pedido de voto ou qualificação do candidato (neutralidade)")

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

    if fato.get("status") == "publicado" and isinstance(fid, str) and fid.startswith("exemplo-"):
        erros.append(f"{rotulo}: registro de exemplo não pode ser publicado (esquema)")
    return fid if isinstance(fid, str) else None


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
