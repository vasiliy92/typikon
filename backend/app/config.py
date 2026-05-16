"""Application configuration — all settings from environment variables."""
from __future__ import annotations

import os
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Settings:
    DATABASE_URL: str = "postgresql+asyncpg://typikon:typikon_dev@localhost:5432/typikon"
    REDIS_URL: str = "redis://localhost:6379/0"
    ADMIN_API_KEY: str = "change-me-in-production"
    SUPERADMIN_EMAIL: str = ""
    SUPERADMIN_PASSWORD: str = ""
    LOG_LEVEL: str = "info"
    CORS_ORIGINS: list[str] = field(default_factory=lambda: ["*"])

    @classmethod
    def from_env(cls) -> Settings:
        origins_raw = os.getenv("CORS_ORIGINS", "*")
        origins = [o.strip() for o in origins_raw.split(",") if o.strip()]
        return cls(
            DATABASE_URL=os.getenv("DATABASE_URL", cls.DATABASE_URL),
            REDIS_URL=os.getenv("REDIS_URL", cls.REDIS_URL),
            ADMIN_API_KEY=os.getenv("ADMIN_API_KEY", cls.ADMIN_API_KEY),
            SUPERADMIN_EMAIL=os.getenv("SUPERADMIN_EMAIL", ""),
            SUPERADMIN_PASSWORD=os.getenv("SUPERADMIN_PASSWORD", ""),
            LOG_LEVEL=os.getenv("LOG_LEVEL", cls.LOG_LEVEL),
            CORS_ORIGINS=origins,
        )


settings = Settings.from_env()
