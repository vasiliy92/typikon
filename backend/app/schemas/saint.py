"""Pydantic schemas for Saint CRUD operations."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SaintCreate(BaseModel):
    slug: str
    name_ru: str
    name_fr: Optional[str] = None
    life_summary_ru: Optional[str] = None
    life_summary_fr: Optional[str] = None
    troparion_ru: Optional[str] = None
    troparion_fr: Optional[str] = None
    troparion_tone: Optional[str] = None
    kontakion_ru: Optional[str] = None
    kontakion_fr: Optional[str] = None
    kontakion_tone: Optional[str] = None
    icon_url: Optional[str] = None
    icon_thumbnail_url: Optional[str] = None
    categories: Optional[str] = None  # JSON array string
    reposed_year: Optional[int] = None


class SaintUpdate(BaseModel):
    slug: Optional[str] = None
    name_ru: Optional[str] = None
    name_fr: Optional[str] = None
    life_summary_ru: Optional[str] = None
    life_summary_fr: Optional[str] = None
    troparion_ru: Optional[str] = None
    troparion_fr: Optional[str] = None
    troparion_tone: Optional[str] = None
    kontakion_ru: Optional[str] = None
    kontakion_fr: Optional[str] = None
    kontakion_tone: Optional[str] = None
    icon_url: Optional[str] = None
    icon_thumbnail_url: Optional[str] = None
    categories: Optional[str] = None
    reposed_year: Optional[int] = None


class SaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name_ru: str
    name_fr: Optional[str] = None
    life_summary_ru: Optional[str] = None
    life_summary_fr: Optional[str] = None
    troparion_ru: Optional[str] = None
    troparion_fr: Optional[str] = None
    troparion_tone: Optional[str] = None
    kontakion_ru: Optional[str] = None
    kontakion_fr: Optional[str] = None
    kontakion_tone: Optional[str] = None
    icon_url: Optional[str] = None
    icon_thumbnail_url: Optional[str] = None
    categories: Optional[str] = None
    reposed_year: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None