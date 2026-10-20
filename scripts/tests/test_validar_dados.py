"""Testes do validar_dados.py — fixtures descartáveis, nunca os dados reais."""
import json
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import validar_dados  # noqa: E402

HOJE = date(2026, 10, 18)


def fato_ok(**sobrescreve):
    base = {
        "id": "candidato-a-candidatura-001",
        "candidato": "candidato-a",
        "tema": "candidatura",
        "tipo": "dado",
        "afirmacao": "O pedido de registro da candidatura consta no DivulgaCandContas, do TSE.",
        "data": "2026-08",
        "fontes": [
            {
                "titulo": "DivulgaCandContas — consulta de candidaturas",
                "url": "https://divulgacandcontas.tse.jus.br/",
                "veiculo": "TSE",
                "acessado_em": "2026-10-18",
                "primaria": True,
            }
        ],
        "status": "publicado",
        "atualizado_em": "2026-10-18",
    }
    base.update(sobrescreve)
    return base


class Fixture:
    def __init__(self, fatos, candidatos=None, temas=None):
        self.dir = tempfile.TemporaryDirectory()
        raiz = Path(self.dir.name)
        (raiz / "fatos.json").write_text(json.dumps(fatos), encoding="utf-8")
        (raiz / "candidatos.json").write_text(
            json.dumps(
                candidatos
                or {
                    "candidato-a": {"nome": "Candidato A", "numero": "00", "partido": "Partido A"},
                    "candidato-b": {"nome": "Candidato B", "numero": "99", "partido": "Partido B"},
                }
            ),
            encoding="utf-8",
        )
        (raiz / "temas.json").write_text(json.dumps(temas or {"candidatura": {"rotulo": "Candidatura"}}), encoding="utf-8")
        self.raiz = raiz

    def erros(self):
        return validar_dados.validar(self.raiz, hoje=HOJE)


class TestValidarDados(unittest.TestCase):
    def test_fato_completo_passa(self):
        self.assertEqual(Fixture([fato_ok()]).erros(), [])

    def test_sem_fonte_reprova(self):
        erros = Fixture([fato_ok(fontes=[])]).erros()
        self.assertTrue(any("sem fonte" in e for e in erros))

    def test_url_sem_https_reprova(self):
        f = fato_ok()
        f["fontes"][0]["url"] = "http://exemplo.gov.br"
        self.assertTrue(any("https://" in e for e in Fixture([f]).erros()))

    def test_pedido_de_voto_reprova(self):
        f = fato_ok(afirmacao="Vote em quem cumpre o que promete.")
        self.assertTrue(any("neutralidade" in e for e in Fixture([f]).erros()))

    def test_qualificacao_no_contexto_reprova(self):
        f = fato_ok(contexto="O candidato é mentiroso e isso explica tudo.")
        self.assertTrue(any("neutralidade" in e for e in Fixture([f]).erros()))

    def test_id_repetido_reprova(self):
        erros = Fixture([fato_ok(), fato_ok()]).erros()
        self.assertTrue(any("id repetido" in e for e in erros))

    def test_candidato_desconhecido_reprova(self):
        erros = Fixture([fato_ok(candidato="candidato-inexistente")]).erros()
        self.assertTrue(any("candidato «candidato-inexistente»" in e for e in erros))

    def test_tema_desconhecido_reprova(self):
        erros = Fixture([fato_ok(tema="esporte")]).erros()
        self.assertTrue(any("tema «esporte»" in e for e in erros))

    def test_data_invalida_reprova(self):
        erros = Fixture([fato_ok(data="2025-13")]).erros()
        self.assertTrue(any("data precisa" in e for e in erros))

    def test_acessado_no_futuro_reprova(self):
        f = fato_ok()
        f["fontes"][0]["acessado_em"] = "2027-01-01"
        self.assertTrue(any("no futuro" in e for e in Fixture([f]).erros()))

    def test_afirmacao_curta_reprova(self):
        erros = Fixture([fato_ok(afirmacao="Curta demais.")]).erros()
        self.assertTrue(any("entre 20 e 280" in e for e in erros))

    def test_campo_desconhecido_reprova(self):
        erros = Fixture([fato_ok(opiniao="x")]).erros()
        self.assertTrue(any("campo desconhecido «opiniao»" in e for e in erros))

    def test_exemplo_publicado_reprova(self):
        erros = Fixture([fato_ok(id="exemplo-candidatura-000")]).erros()
        self.assertTrue(any("exemplo" in e for e in erros))

    def test_rascunho_de_exemplo_passa(self):
        self.assertEqual(Fixture([fato_ok(id="exemplo-candidatura-000", status="rascunho")]).erros(), [])

    def test_json_invalido_reprova(self):
        fx = Fixture([fato_ok()])
        (fx.raiz / "fatos.json").write_text("{", encoding="utf-8")
        self.assertTrue(any("JSON inválido" in e for e in fx.erros()))


if __name__ == "__main__":
    unittest.main()
