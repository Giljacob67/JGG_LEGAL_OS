from connectors.esaj_base import ESAJBaseConnector


class TJSPConnector(ESAJBaseConnector):
    tribunal_id = "tjsp"
    nome = "Tribunal de Justiça de São Paulo"
    sistema = "esaj"
    base_url = "https://esaj.tjsp.jus.br"
    consulta_url = "https://esaj.tjsp.jus.br/cpo/pg/search.do"
