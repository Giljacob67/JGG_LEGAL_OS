"""
Autenticação PJe — login via CPF/CNPJ ou OAB + senha.
Funciona para TJMT, TRF1 e outras instâncias PJe que usam login padrão.

Fluxo:
1. GET na página principal → captura URL de login
2. POST com credenciais → extrai cookies de sessão
3. Valida sessão acessando área logada
4. Reutiliza cookies em requisições subsequentes

Limitações do MVP:
- Não lida com certificado digital A1/A3
- Não resolve captchas (delega para detecção + log)
- Usa apenas autenticação usuario/senha
"""
from __future__ import annotations

import logging
import re
from typing import Optional
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# URLs comuns de login em instâncias PJe
_LOGIN_PATHS = [
    "/login.seam",
    "/autenticacao",
    "/logar",
]


def _detect_login_url(html: str, base_url: str) -> Optional[str]:
    """Tenta encontrar o link/form de login no HTML da página inicial."""
    soup = BeautifulSoup(html, "lxml")

    # Procura link com texto "login", "entrar", "autenticar"
    for a in soup.find_all("a", href=True):
        text = a.get_text(strip=True).lower()
        href = a["href"].lower()
        if any(k in text for k in ("login", "entrar", "autenticar", "acesso")):
            return urljoin(base_url, a["href"])
        if any(k in href for k in ("login", "autenticacao", "logar")):
            return urljoin(base_url, a["href"])

    # Fallback: tenta paths conhecidos
    for path in _LOGIN_PATHS:
        candidate = urljoin(base_url, path)
        if candidate not in (base_url, base_url + "/"):
            return candidate

    return None


class PJeAuthenticator:
    """Autentica em instâncias PJe usando login/senha."""

    def __init__(self, base_url: str, tribunal_id: str):
        self._base_url = base_url.rstrip("/")
        self._tribunal_id = tribunal_id
        self._login_url: Optional[str] = None

    async def authenticate(
        self,
        client: httpx.AsyncClient,
        login: str,
        senha: str,
        oab_uf: Optional[str] = None,
    ) -> bool:
        """
        Realiza login e retorna True se a sessão está ativa.
        O client deve ser reutilizado (cookies persistentes).
        """
        try:
            # 1. Descobre URL de login
            if not self._login_url:
                self._login_url = await self._discover_login_url(client)
                if not self._login_url:
                    logger.error("pje_login_url_nao_encontrada tribunal=%s", self._tribunal_id)
                    return False

            # 2. Carrega página de login para extrair campos do form
            login_html = await self._get_login_page(client)
            form_data = self._build_login_payload(login_html, login, senha, oab_uf)

            # 3. POST de login
            r = await client.post(
                self._login_url,
                data=form_data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Referer": self._login_url,
                },
                timeout=30,
                follow_redirects=True,
            )

            # 4. Valida se login funcionou
            if self._is_authenticated(r.text):
                logger.info("pje_login_ok tribunal=%s usuario=%s", self._tribunal_id, login)
                return True

            # Verifica se é erro de credenciais
            if self._is_invalid_credentials(r.text):
                logger.warning("pje_login_credenciais_invalidas tribunal=%s usuario=%s", self._tribunal_id, login)
                return False

            # Verifica captcha no login
            if self._detect_captcha(r.text):
                logger.warning("pje_login_captcha tribunal=%s usuario=%s", self._tribunal_id, login)
                return False

            logger.warning("pje_login_inesperado tribunal=%s status=%d html_len=%d", self._tribunal_id, r.status_code, len(r.text))
            return False

        except httpx.TimeoutException:
            logger.warning("pje_login_timeout tribunal=%s", self._tribunal_id)
            return False
        except Exception:
            logger.exception("pje_login_erro tribunal=%s", self._tribunal_id)
            return False

    async def _discover_login_url(self, client: httpx.AsyncClient) -> Optional[str]:
        """Tenta descobrir a URL real de login."""
        r = await client.get(self._base_url, timeout=15, follow_redirects=True)
        r.raise_for_status()
        url = _detect_login_url(r.text, str(r.url))
        if url:
            logger.debug("pje_login_url_detectada tribunal=%s url=%s", self._tribunal_id, url)
        return url

    async def _get_login_page(self, client: httpx.AsyncClient) -> str:
        """Carrega HTML da página de login."""
        r = await client.get(self._login_url, timeout=15, follow_redirects=True)
        r.raise_for_status()
        return r.text

    def _build_login_payload(
        self,
        html: str,
        login: str,
        senha: str,
        oab_uf: Optional[str],
    ) -> dict[str, str]:
        """Extrai campos hidden do form e monta payload de login."""
        soup = BeautifulSoup(html, "lxml")
        payload: dict[str, str] = {}

        # Copia todos os campos hidden do form de login
        form = soup.find("form")
        if form:
            for inp in form.find_all("input", type="hidden"):
                name = inp.get("name")
                value = inp.get("value", "")
                if name:
                    payload[name] = value

        # Heurística: campo de usuário pode ter vários nomes
        usuario_field = self._detect_username_field(soup)
        senha_field = self._detect_password_field(soup)

        if usuario_field:
            payload[usuario_field] = login
        if senha_field:
            payload[senha_field] = senha

        # Alguns PJe exigem seleção de órgão/UF da OAB
        if oab_uf:
            payload["orgao"] = oab_uf
            payload["uf"] = oab_uf

        # Botão de submit (alguns forms exigem)
        submit = soup.find("input", type="submit")
        if submit and submit.get("name"):
            payload[submit["name"]] = submit.get("value", "Entrar")

        return payload

    @staticmethod
    def _detect_username_field(soup: BeautifulSoup) -> Optional[str]:
        """Heurística para encontrar o name do campo de usuário."""
        candidates = [
            "username", "j_username", "login", "usuario", "cpf", "oab",
            "j_idt",  # JSF padrão
        ]
        for inp in soup.find_all("input"):
            name = inp.get("name", "").lower()
            id_attr = inp.get("id", "").lower()
            type_attr = inp.get("type", "text").lower()
            if type_attr not in ("text", "email", "tel"):
                continue
            if any(c in name or c in id_attr for c in candidates):
                return inp.get("name")
        # Fallback: primeiro input text do form de login
        form = soup.find("form")
        if form:
            first_text = form.find("input", type="text")
            if first_text:
                return first_text.get("name")
        return None

    @staticmethod
    def _detect_password_field(soup: BeautifulSoup) -> Optional[str]:
        """Heurística para encontrar o name do campo de senha."""
        pwd = soup.find("input", {"type": "password"})
        if pwd:
            return pwd.get("name")
        return None

    @staticmethod
    def _is_authenticated(html: str) -> bool:
        """Detecta se a resposta indica usuário logado."""
        lower = html.lower()
        # Sinais de que está logado
        positive = [
            "sair", "logout", "meus processos", " área restrita",
            "painel", "dashboard", "bem-vindo", "bem vindo",
        ]
        # Sinais de que ainda está na tela de login
        negative = [
            "senha", "password", "login", "autenticação",
            "credenciais inválidas", "usuário ou senha incorretos",
        ]

        pos_score = sum(1 for p in positive if p in lower)
        neg_score = sum(1 for n in negative if n in lower)

        # Se tem mais sinais positivos que negativos, provavelmente logou
        return pos_score > neg_score

    @staticmethod
    def _is_invalid_credentials(html: str) -> bool:
        lower = html.lower()
        patterns = [
            "credenciais inválidas", "usuário ou senha incorretos",
            "login ou senha inválidos", "autenticação falhou",
            "não foi possível autenticar", "senha incorreta",
        ]
        return any(p in lower for p in patterns)

    @staticmethod
    def _detect_captcha(html: str) -> bool:
        lower = html.lower()
        patterns = ["captcha", "recaptcha", "sou humano", "not a robot"]
        return any(p in lower for p in patterns)
