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
        "conferido_por": "Pessoa Conferente",
        "conferido_em": "2026-10-18",
    }
    base.update(sobrescreve)
    return base


def fonte_imprensa(veiculo):
    return {
        "titulo": "Notícia sobre a candidatura (18/out/2026)",
        "anonimo": "Notícia de 18/out/2026",
        "url": "https://exemplo.com.br/noticia",
        "veiculo": veiculo,
        "acessado_em": "2026-10-18",
    }


def fato_beta(**sobrescreve):
    """Fato no ar sem conferência humana: buscado e revisado por IA, com a data da busca."""
    f = fato_ok(status="beta", revisado_por="ia", buscado_em="2026-10-17", ordem=1, etiqueta="promessa", tags=["promessa"])
    del f["conferido_por"]
    del f["conferido_em"]
    f.update(sobrescreve)
    return f


class Fixture:
    def __init__(self, fatos, candidatos=None, temas=None):
        self.dir = tempfile.TemporaryDirectory()
        raiz = Path(self.dir.name)
        (raiz / "fatos.json").write_text(json.dumps(fatos), encoding="utf-8")
        (raiz / "candidatos.json").write_text(
            json.dumps(
                candidatos
                or {
                    "candidato-a": {"nome": "Candidato Alfa", "numero": "00", "partido": "Partido Alfa"},
                    "candidato-b": {"nome": "Candidato Beta", "numero": "99", "partido": "Partido Beta"},
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
        self.assertTrue(any("entre 20 e 800" in e for e in erros))

    def test_afirmacao_longa_de_caderno_passa(self):
        self.assertEqual(Fixture([fato_ok(afirmacao="O plano de governo {quem} registrado no TSE " + "prevê uma medida, " * 25 + "sem prazo.")]).erros(), [])

    def test_afirmacao_acima_de_800_reprova(self):
        erros = Fixture([fato_ok(afirmacao="x" * 801)]).erros()
        self.assertTrue(any("entre 20 e 800" in e for e in erros))

    def test_campo_desconhecido_reprova(self):
        erros = Fixture([fato_ok(opiniao="x")]).erros()
        self.assertTrue(any("campo desconhecido «opiniao»" in e for e in erros))

    def test_exemplo_publicado_reprova(self):
        erros = Fixture([fato_ok(id="exemplo-candidatura-000")]).erros()
        self.assertTrue(any("exemplo" in e for e in erros))

    def test_rascunho_de_exemplo_passa(self):
        self.assertEqual(Fixture([fato_ok(id="exemplo-candidatura-000", status="rascunho")]).erros(), [])

    def test_publicado_sem_conferencia_reprova(self):
        f = fato_ok()
        del f["conferido_por"]
        del f["conferido_em"]
        erros = Fixture([f]).erros()
        self.assertTrue(any("sem «conferido_por»" in e for e in erros))
        self.assertTrue(any("sem «conferido_em»" in e for e in erros))

    def test_rascunho_sem_conferencia_passa(self):
        f = fato_ok(status="rascunho")
        del f["conferido_por"]
        del f["conferido_em"]
        self.assertEqual(Fixture([f]).erros(), [])

    def test_conferido_por_vazio_reprova(self):
        erros = Fixture([fato_ok(conferido_por="  ")]).erros()
        self.assertTrue(any("conferido_por é o nome" in e for e in erros))

    def test_conferido_em_no_futuro_reprova(self):
        erros = Fixture([fato_ok(conferido_em="2026-10-19")]).erros()
        self.assertTrue(any("conferido_em no futuro" in e for e in erros))

    def test_conferido_antes_da_ultima_edicao_reprova(self):
        erros = Fixture([fato_ok(atualizado_em="2026-10-18", conferido_em="2026-10-17")]).erros()
        self.assertTrue(any("conferido_em antes de atualizado_em" in e for e in erros))

    # ---------- beta: buscado e revisado por IA, no ar com carimbo (convenções, seção 6) ----------
    def test_beta_completo_passa(self):
        self.assertEqual(Fixture([fato_beta()]).erros(), [])

    def test_beta_sem_buscado_em_reprova(self):
        f = fato_beta()
        del f["buscado_em"]
        self.assertTrue(any("sem «buscado_em»" in e for e in Fixture([f]).erros()))

    def test_beta_sem_revisado_por_ia_reprova(self):
        erros = Fixture([fato_beta(revisado_por="pessoa")]).erros()
        self.assertTrue(any("«revisado_por»: «ia»" in e for e in erros))

    def test_beta_conferido_por_pessoa_reprova(self):
        erros = Fixture([fato_beta(conferido_por="Pessoa Conferente", conferido_em="2026-10-18")]).erros()
        self.assertTrue(any("o status é publicado" in e for e in erros))

    def test_buscado_em_no_futuro_reprova(self):
        erros = Fixture([fato_beta(buscado_em="2026-10-19")]).erros()
        self.assertTrue(any("buscado_em no futuro" in e for e in erros))

    def test_beta_de_exemplo_reprova(self):
        erros = Fixture([fato_beta(id="exemplo-candidatura-000")]).erros()
        self.assertTrue(any("exemplo" in e for e in erros))

    # ---------- régua do que vai ao ar: fonte primária ou dois veículos independentes ----------
    def test_uma_fonte_nao_primaria_no_ar_reprova(self):
        f = fato_beta()
        f["fontes"][0]["primaria"] = False
        self.assertTrue(any("fonte primária ou de dois veículos" in e for e in Fixture([f]).erros()))

    def test_dois_veiculos_independentes_no_ar_passa(self):
        f = fato_beta()
        f["fontes"] = [fonte_imprensa("Jornal A"), fonte_imprensa("Jornal B")]
        self.assertEqual(Fixture([f]).erros(), [])

    def test_mesmo_veiculo_duas_vezes_no_ar_reprova(self):
        f = fato_beta()
        f["fontes"] = [fonte_imprensa("Jornal A"), fonte_imprensa("jornal a")]
        self.assertTrue(any("dois veículos" in e for e in Fixture([f]).erros()))

    def test_rascunho_com_uma_fonte_de_imprensa_passa(self):
        f = fato_ok(status="rascunho", fontes=[fonte_imprensa("Jornal A")])
        del f["conferido_por"]
        del f["conferido_em"]
        self.assertEqual(Fixture([f]).erros(), [])

    # ---------- leitura às cegas: o texto no ar não entrega a candidatura ----------
    def test_nome_do_candidato_na_afirmacao_reprova(self):
        f = fato_beta(afirmacao="O plano de Candidato Alfa registrado no TSE prevê uma medida sem prazo definido.")
        erros = Fixture([f]).erros()
        self.assertTrue(any("leitura às cegas" in e and "«Alfa»" in e for e in erros))

    def test_partido_no_contexto_reprova(self):
        erros = Fixture([fato_beta(contexto="Proposta do Partido Alfa, sem prazo.")]).erros()
        self.assertTrue(any("leitura às cegas" in e for e in erros))

    def test_nome_no_titulo_anonimo_da_fonte_reprova(self):
        f = fato_beta()
        f["fontes"][0]["anonimo"] = "Plano de governo de Alfa — p. 3"
        self.assertTrue(any("anonimo» cita «Alfa»" in e for e in Fixture([f]).erros()))

    def test_nome_em_rascunho_passa(self):
        f = fato_ok(status="rascunho", afirmacao="Rascunho que cita Candidato Alfa para quem edita, ainda fora do ar.")
        del f["conferido_por"]
        del f["conferido_em"]
        self.assertEqual(Fixture([f]).erros(), [])

    def test_marcadores_de_anonimato_passam(self):
        f = fato_beta(afirmacao="O plano de governo {quem} registrado no TSE prevê uma medida, sem prazo definido.")
        f["fontes"][0]["titulo"] = "Plano de governo de {nome} — p. 3"
        self.assertEqual(Fixture([f]).erros(), [])

    def test_tags_e_ordem_invalidos_reprovam(self):
        erros = Fixture([fato_beta(tags=["Promessa"], ordem=0)]).erros()
        self.assertTrue(any("tags é lista" in e for e in erros))
        self.assertTrue(any("ordem é inteiro" in e for e in erros))

    def test_json_invalido_reprova(self):
        fx = Fixture([fato_ok()])
        (fx.raiz / "fatos.json").write_text("{", encoding="utf-8")
        self.assertTrue(any("JSON inválido" in e for e in fx.erros()))


if __name__ == "__main__":
    unittest.main()
