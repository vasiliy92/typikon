"""Async Redis client — optional, used for service cache."""
from __future__ import annotations

from app.config import settings

redis_client = None


async def init_redis() -> None:
    """Initialize Redis connection on startup. Non-fatal if unavailable."""
    global redis_client
    try:
        import redis.asyncio as aioredis
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await redis_client.ping()
    except Exception:
        redis_client = None


async def get_redis():
    """Return the Redis client (may be None if unavailable)."""
    return redis_client