from connectors.esaj_base import ESAJBaseConnector


class TJRSConnector(ESAJBaseConnector):
    tribunal_id = "tjrs"
    nome = "Tribunal de Justiça do Rio Grande do Sul"
    sistema = "esaj"
    base_url = "https://www.tjrs.jus.br"
    consulta_url = (
        "https://www.tjrs.jus.br/site_php/consulta/index.php"
        "?tipo_nome=processo&tipo_numero=unificado&acao=buscar"
    )
