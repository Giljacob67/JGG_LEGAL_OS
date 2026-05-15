"""Enums do domínio de monitoramento processual."""

from enum import Enum


class Tribunal(str, Enum):
    TJPR = "tjpr"
    TJMT = "tjmt"
    TRF4 = "trf4"
    TRF1 = "trf1"
    TJRS = "tjrs"
    TJSP = "tjsp"
    TRF3 = "trf3"


class SistemaTribunal(str, Enum):
    PROJUDI = "projudi"
    PJE = "pje"
    EPROC = "eproc"
    ESAJ = "esaj"
    DATAJUD = "datajud"


class StatusMonitoramento(str, Enum):
    ATIVO = "ativo"
    ARQUIVADO = "arquivado"
    SUSPENSO = "suspenso"
    ENCERRADO = "encerrado"
    DESCONHECIDO = "desconhecido"


class StatusSync(str, Enum):
    OK = "ok"
    ATRASADO = "atrasado"
    SEM_FONTE = "sem_fonte"
    FALHA = "falha"
    EM_PROGRESSO = "em_progresso"


class Prioridade(str, Enum):
    ALTA = "alta"
    NORMAL = "normal"
    BAIXA = "baixa"


class TipoEvento(str, Enum):
    MOVIMENTACAO = "movimentacao"
    DECISAO = "decisao"
    SENTENCA = "sentenca"
    AUDIENCIA = "audiencia"
    OUTRO = "outro"


class StatusCaptureRun(str, Enum):
    STARTED = "started"
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"


class ConnectorStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"
    UNKNOWN = "unknown"
