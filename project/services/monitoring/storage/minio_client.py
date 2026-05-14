import hashlib
import io
import logging
from typing import Optional

from minio import Minio
from minio.error import S3Error

logger = logging.getLogger(__name__)


class DocumentoStorage:
    def __init__(
        self,
        endpoint: str,
        access_key: str,
        secret_key: str,
        bucket: str = "documentos-tribunais",
        secure: bool = False,
    ):
        self._client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure,
        )
        self._bucket = bucket
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        try:
            if not self._client.bucket_exists(self._bucket):
                self._client.make_bucket(self._bucket)
                logger.info("bucket_criado bucket=%s", self._bucket)
        except S3Error as e:
            logger.error("erro_bucket bucket=%s erro=%s", self._bucket, e)

    def salvar(
        self,
        cnj: str,
        doc_id: str,
        content: bytes,
        mime_type: str = "application/pdf",
    ) -> tuple[str, str, str]:
        """
        Salva documento no MinIO.
        Retorna (storage_key, storage_url, hash_sha256).
        """
        cnj_path = cnj.replace("/", "_").replace(" ", "_")
        key = f"processos/{cnj_path}/{doc_id}.pdf"
        hash_sha256 = hashlib.sha256(content).hexdigest()

        self._client.put_object(
            self._bucket,
            key,
            data=io.BytesIO(content),
            length=len(content),
            content_type=mime_type,
        )

        # URL interna (via MinIO API — gera presigned URL de 7 dias)
        url = self._presigned_url(key)
        return key, url, hash_sha256

    def _presigned_url(self, key: str, expires_days: int = 7) -> str:
        from datetime import timedelta
        try:
            return self._client.presigned_get_object(
                self._bucket, key, expires=timedelta(days=expires_days)
            )
        except S3Error:
            return f"minio://{self._bucket}/{key}"

    def url_permanente(self, key: str) -> str:
        """URL interna Docker — válida dentro da rede."""
        return f"http://minio:9000/{self._bucket}/{key}"

    def existe(self, hash_sha256: str) -> bool:
        """Não há index por hash no MinIO — verificação feita no banco."""
        return False

    def deletar(self, key: str) -> None:
        try:
            self._client.remove_object(self._bucket, key)
        except S3Error as e:
            logger.warning("erro_deletar_doc key=%s erro=%s", key, e)
