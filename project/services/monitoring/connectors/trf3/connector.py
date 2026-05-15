from connectors.pje_base import PJeBaseConnector


class TRF3Connector(PJeBaseConnector):
    tribunal_id = "trf3"
    nome = "Tribunal Regional Federal da 3ª Região"
    sistema = "pje"
    base_url = "https://pje.trf3.jus.br/pje"
    consulta_url = "https://pje.trf3.jus.br/pje/ConsultaPublica/listView.seam"
