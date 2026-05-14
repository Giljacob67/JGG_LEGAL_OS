from connectors.pje_base import PJeBaseConnector


class TJMTConnector(PJeBaseConnector):
    tribunal_id = "tjmt"
    nome = "Tribunal de Justiça de Mato Grosso"
    sistema = "pje"
    base_url = "https://pje.tjmt.jus.br/pje"
    consulta_url = "https://pje.tjmt.jus.br/pje/ConsultaPublica/listView.seam"
