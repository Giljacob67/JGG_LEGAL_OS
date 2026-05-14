from connectors.pje_base import PJeBaseConnector


class TJPRConnector(PJeBaseConnector):
    tribunal_id = "tjpr"
    nome = "Tribunal de Justiça do Paraná"
    sistema = "pje"
    base_url = "https://pje.tjpr.jus.br/pje"
    consulta_url = "https://pje.tjpr.jus.br/pje/ConsultaPublica/listView.seam"
