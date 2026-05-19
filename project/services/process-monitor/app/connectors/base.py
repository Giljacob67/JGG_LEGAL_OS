"""Interface base para conectores de tribunais."""

from abc import ABC, abstractmethod
from typing import Any

from app.models.schemas import ConnectorHealth, ConnectorResult


class TribunalConnector(ABC):
    """Interface que todo conector de tribunal deve implementar."""

    @property
    @abstractmethod
    def tribunal(self) -> str:
        """Identificador do tribunal (ex: tjpr, trf4)."""
        ...

    @property
    @abstractmethod
    def nome(self) -> str:
        """Nome legível do conector."""
        ...

    @property
    def needs_credentials(self) -> bool:
        """Se True, o conector precisa de credenciais para funcionar em public_http."""
        return False

    def _apply_credentials(self, session: Any) -> None:
        """Aplica credenciais no SessionManager (stub — futuramente via API do app web)."""
        # As credenciais são gerenciadas pelo app web (Prisma).
        # O process-monitor receberá as credenciais necessárias via parâmetro
        # de chamada quando o sistema de sync estiver ativo.
        # Por enquanto, conectores sem credencial funcionam em modo público.
        pass

    @abstractmethod
    async def login(self, credentials: dict[str, Any]) -> bool:
        """Autentica no tribunal, se necessário."""
        ...

    @abstractmethod
    async def buscar_processo_por_numero(self, numero_cnj: str) -> ConnectorResult:
        """Busca processo pelo número CNJ."""
        ...

    @abstractmethod
    async def listar_andamentos(self, processo_id_tribunal: str) -> ConnectorResult:
        """Lista movimentações de um processo."""
        ...

    @abstractmethod
    async def listar_documentos(self, processo_id_tribunal: str) -> ConnectorResult:
        """Lista documentos públicos disponíveis."""
        ...

    @abstractmethod
    async def baixar_documento(self, documento_id_tribunal: str) -> bytes:
        """Baixa conteúdo binário do documento."""
        ...

    @abstractmethod
    async def healthcheck(self) -> ConnectorHealth:
        """Verifica saúde do conector."""
        ...
