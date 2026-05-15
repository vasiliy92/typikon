"""Async Redis client with graceful fallback."""
from __future__ import annotations

import logging

from app.config import settings

logger = logging.getLogger(__name__)

redis_client = None

try:
    import redis.asyncio as aioredis
    redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception:
    logger.warning("Redis not available — caching disabled")


async def get_cached(key: str) -> str | None:
    if not redis_client:
        return None
    try:
        return await redis_client.get(key)
    except Exception:
        return None


async def set_cached(key: str, value: str, ttl: int = 3600) -> None:
    if not redis_client:
        return
    try:
        await redis_client.set(key, value, ex=ttl)
    except Exception:
        pass
