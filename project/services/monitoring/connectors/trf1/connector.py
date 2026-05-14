from connectors.pje_base import PJeBaseConnector


class TRF1Connector(PJeBaseConnector):
    tribunal_id = "trf1"
    nome = "Tribunal Regional Federal da 1ª Região"
    sistema = "pje"
    base_url = "https://pje.trf1.jus.br/pje"
    consulta_url = "https://pje.trf1.jus.br/pje/ConsultaPublica/listView.seam"
