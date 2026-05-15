"""Typikon — Orthodox Christian Liturgical Service Generator.

FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router as api_router
from app.config import settings
from app.services.db import async_engine
from app.services.redis import redis_client


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown hooks."""
    # Startup
    yield
    # Shutdown
    await async_engine.dispose()
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
