from connectors.projudi_base import ProJUDIBaseConnector


class TJPRConnector(ProJUDIBaseConnector):
    tribunal_id = "tjpr"
    nome = "Tribunal de Justiça do Paraná"
    sistema = "projudi"
    base_url = "https://consulta.tjpr.jus.br/projudi_consulta"
    search_url = (
        "https://consulta.tjpr.jus.br/projudi_consulta"
        "/processo/consultaPublica.do?actionType=iniciar"
    )
