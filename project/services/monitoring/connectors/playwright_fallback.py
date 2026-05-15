"""
Fallback com Playwright para tribunais que bloqueiam HTTP puro.

Regras de uso:
1. Só ativa quando HTTP puro retorna captcha_detectado=True ou falha de layout
2. Navegador headless executa JS, resolve redirects, lida com cookies automaticamente
3. Extrai HTML final e delega parsing aos conectores existentes
4. Não baixa documentos grandes via Playwright (apenas extrai metadados/links)

Instalação (opcional):
    pip install playwright
    playwright install chromium

Se Playwright não estiver instalado, o fallback simplesmente não é tentado.
"""
from __future__ import annotations

import logging
import os
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from playwright.async_api import Browser, BrowserContext, Page

logger = logging.getLogger(__name__)

# Singletons gerenciados globalmente
_browser: Optional["Browser"] = None
_context: Optional["BrowserContext"] = None


def _playwright_available() -> bool:
    try:
        import playwright  # noqa: F401
        return True
    except ImportError:
        return False


async def _get_browser(headless: bool = True) -> Optional["Browser"]:
    """Inicializa browser Chromium headless (singleton)."""
    global _browser
    if _browser is not None:
        return _browser

    if not _playwright_available():
        logger.warning("playwright_nao_instalado")
        return None

    from playwright.async_api import async_playwright

    pw = await async_playwright().start()
    _browser = await pw.chromium.launch(
        headless=headless,
        args=[
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-dev-shm-usage",
        ],
    )
    logger.info("playwright_browser_iniciado headless=%s", headless)
    return _browser


async def _get_context() -> Optional["BrowserContext"]:
    """Cria ou reutiliza contexto de navegação isolado."""
    global _context
    if _context is not None:
        return _context

    browser = await _get_browser()
    if not browser:
        return None

    _context = await browser.new_context(
        user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport={"width": 1366, "height": 768},
        locale="pt-BR",
        timezone_id="America/Sao_Paulo",
    )
    return _context


async def close_browser() -> None:
    """Fecha browser e libera recursos."""
    global _browser, _context
    if _context:
        await _context.close()
        _context = None
    if _browser:
        await _browser.close()
        _browser = None
    logger.info("playwright_browser_fechado")


async def fetch_html_with_browser(
    url: str,
    wait_for: Optional[str] = None,
    timeout_ms: int = 30000,
    post_data: Optional[dict] = None,
) -> Optional[str]:
    """
    Navega até a URL e retorna o HTML final.

    Args:
        url: URL completa de destino.
        wait_for: Seletor CSS para aguardar antes de capturar HTML.
        timeout_ms: Timeout total em milissegundos.
        post_data: Se informado, preenche um form simples e submete.
    """
    context = await _get_context()
    if not context:
        return None

    page: Optional["Page"] = None
    try:
        page = await context.new_page()

        if post_data:
            # Navega, preenche form e submete
            await page.goto(url, wait_until="networkidle", timeout=timeout_ms)
            for selector, value in post_data.items():
                await page.fill(selector, value)
            # Tenta encontrar e clicar em botão de submit
            submit_btn = await page.query_selector('input[type="submit"], button[type="submit"]')
            if submit_btn:
                await submit_btn.click()
            else:
                await page.keyboard.press("Enter")
            await page.wait_for_load_state("networkidle", timeout=timeout_ms)
        else:
            await page.goto(url, wait_until="networkidle", timeout=timeout_ms)

        # Aguarda elemento específico, se solicitado
        if wait_for:
            try:
                await page.wait_for_selector(wait_for, timeout=10000)
            except Exception:
                logger.warning("playwright_selector_nao_encontrado selector=%s", wait_for)

        # Scroll até o fim da página para garantir lazy-loading
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(500)

        html = await page.content()
        logger.info("playwright_fetch_ok url=%s html_len=%d", url, len(html))
        return html

    except Exception as exc:
        logger.warning("playwright_fetch_erro url=%s erro=%s", url, exc)
        return None
    finally:
        if page:
            await page.close()


class PlaywrightFallbackConnector:
    """
    Wrapper que tenta HTTP primeiro e usa Playwright como fallback.
    Delega parsing ao connector original.
    """

    def __init__(self, inner_connector):
        self._inner = inner_connector
        self.tribunal_id = inner_connector.tribunal_id
        self.nome = inner_connector.nome
        self.sistema = inner_connector.sistema
        self.base_url = inner_connector.base_url

    async def buscar_processo(self, cnj: str):
        # Tenta HTTP puro primeiro
        resultado = await self._inner.buscar_processo(cnj)
        if resultado.sucesso or resultado.captcha_detectado:
            return resultado

        # Fallback: Playwright
        logger.info("playwright_fallback_acionado tribunal=%s cnj=%s", self.tribunal_id, cnj)
        html = await self._fetch_via_browser(cnj)
        if not html:
            return resultado  # mantém erro original

        # Delega parsing ao conector original
        return self._parse_from_html(html, cnj)

    async def _fetch_via_browser(self, cnj: str) -> Optional[str]:
        """Monta URL de consulta e busca via Playwright."""
        if self.sistema == "pje":
            # PJe: consulta pública
            url = getattr(self._inner, "consulta_url", self.base_url)
            return await fetch_html_with_browser(
                url,
                wait_for="table.rich-table, #tableMovimentos",
                post_data={"#fPP\\:Nprocesso\\:nProcesso": cnj} if "fPP" in url else None,
            )
        elif self.sistema == "eproc":
            url = f"{self.base_url}/externo_controlador.php?acao=processo_seleciona_publica&num_processo={cnj.replace('.', '').replace('-', '')}"
            return await fetch_html_with_browser(
                url,
                wait_for="table.infraTable, #tableEventos",
            )
        elif self.sistema == "projudi":
            # ProJUDI: POST com numeroProcesso
            url = getattr(self._inner, "search_url", self.base_url)
            return await fetch_html_with_browser(
                url,
                wait_for="#idTableMovimentacoesmov1Grau1",
                post_data={"numeroProcesso": cnj},
            )
        return None

    def _parse_from_html(self, html: str, cnj: str):
        """Usa métodos privados do conector original para parsear HTML."""
        from connectors.base import ResultadoCaptura

        try:
            if hasattr(self._inner, "_parse_andamentos"):
                if self.sistema == "projudi":
                    andamentos = self._inner._parse_andamentos(html, cnj)
                else:
                    andamentos = self._inner._parse_andamentos(html)
            else:
                andamentos = []

            from connectors.document_parser import extrair_documentos_do_html
            documentos = extrair_documentos_do_html(
                html, self.base_url, self.tribunal_id, cnj
            )

            return ResultadoCaptura(
                cnj=cnj,
                tribunal_id=self.tribunal_id,
                sucesso=True,
                andamentos=andamentos,
                documentos=documentos,
                payload_bruto={"html_len": len(html), "fonte": "playwright_fallback"},
            )
        except Exception as exc:
            logger.exception("playwright_parse_erro tribunal=%s cnj=%s", self.tribunal_id, cnj)
            return ResultadoCaptura(
                cnj=cnj,
                tribunal_id=self.tribunal_id,
                sucesso=False,
                erro=f"playwright_fallback_parse_erro: {exc}",
            )
