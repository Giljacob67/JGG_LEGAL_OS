import asyncpg
from typing import Optional

_pool: Optional[asyncpg.Pool] = None


async def get_pool(dsn: str) -> asyncpg.Pool:
    global _pool
    if _pool is None:
        # Converte URL Prisma/SQLAlchemy para asyncpg (remove +asyncpg se presente)
        asyncpg_dsn = dsn.replace("postgresql+asyncpg://", "postgresql://")
        _pool = await asyncpg.create_pool(
            asyncpg_dsn,
            min_size=2,
            max_size=10,
            command_timeout=60,
        )
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
