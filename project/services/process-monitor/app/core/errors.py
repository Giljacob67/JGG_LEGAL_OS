"""Exceções controladas do serviço process-monitor."""


class ProcessMonitorError(Exception):
    """Base para todas as exceções do serviço."""

    error_code: str = "UNKNOWN_ERROR"

    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class CNJInvalidoError(ProcessMonitorError):
    error_code = "CNJ_INVALIDO"


class TribunalNaoSuportadoError(ProcessMonitorError):
    error_code = "TRIBUNAL_NAO_SUPORTADO"


class ConnectorNotImplementedError(ProcessMonitorError):
    error_code = "CONNECTOR_NOT_IMPLEMENTED"


class CaptchaOrBlockError(ProcessMonitorError):
    """Captcha ou bloqueio detectado. NÃO tentar resolver automaticamente."""

    error_code = "CAPTCHA_OR_BLOCK"


class RateLimitError(ProcessMonitorError):
    error_code = "RATE_LIMIT"


class CircuitOpenError(ProcessMonitorError):
    error_code = "CIRCUIT_OPEN"


class ParseError(ProcessMonitorError):
    error_code = "PARSE_ERROR"


class TribunalAuthError(ProcessMonitorError):
    error_code = "TRIBUNAL_AUTH_ERROR"


class NotFoundError(ProcessMonitorError):
    error_code = "NOT_FOUND"
