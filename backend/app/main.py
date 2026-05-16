"""Typikon — Orthodox Christian Liturgical Service Generator.

FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router as api_router
from app.config import settings
from app.services.db import async_engine, async_session
from app.services.redis import init_redis


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown hooks."""
    # Startup
    await init_redis()

    # Bootstrap superadmin from env vars
    from app.services.auth import bootstrap_superadmin
    async with async_session() as db:
        try:
            await bootstrap_superadmin(db)
        except Exception as e:
            print(f"[typikon] Superadmin bootstrap skipped: {e}")

    yield

    # Shutdown
    await async_engine.dispose()
    from app.services.redis import redis_client
    if redis_client:
        await redis_client.close()


app = FastAPI(
    title="Typikon",
    description="Orthodox Christian Liturgical Service Generator",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Store settings on app.state for dependency access
app.state.settings = settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "typikon"}


@app.get("/")
async def root():
    return {
        "service": "typikon",
        "version": "0.1.0",
        "docs": "/api/docs",
    }