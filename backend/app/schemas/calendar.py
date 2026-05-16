"""Pydantic schemas for CalendarEntry CRUD operations."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class CalendarEntryCreate(BaseModel):
    date_type: str  # fixed | movable
    month: Optional[int] = None
    day: Optional[int] = None
    pascha_offset: Optional[int] = None
    title_csy: str
    title_fr: Optional[str] = None
    title_en: Optional[str] = None
    title_ru: Optional[str] = None
    saint_id: Optional[int] = None
    rank: str = "1"
    tone: Optional[int] = None
    fasting: str = "none"
    forefeast_days: int = 0
    afterfeast_days: int = 0
    service_template_id: Optional[int] = None
    rubric: Optional[str] = None

    @field_validator("date_type")
    @classmethod
    def validate_date_type(cls, v: str) -> str:
        if v not in ("fixed", "movable"):
            raise ValueError("date_type must be 'fixed' or 'movable'")
        return v


class CalendarEntryUpdate(BaseModel):
    date_type: Optional[str] = None
    month: Optional[int] = None
    day: Optional[int] = None
    pascha_offset: Optional[int] = None
    title_csy: Optional[str] = None
    title_fr: Optional[str] = None
    title_en: Optional[str] = None
    title_ru: Optional[str] = None
    saint_id: Optional[int] = None
    rank: Optional[str] = None
    tone: Optional[int] = None
    fasting: Optional[str] = None
    forefeast_days: Optional[int] = None
    afterfeast_days: Optional[int] = None
    service_template_id: Optional[int] = None
    rubric: Optional[str] = None


class CalendarEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date_type: str
    month: Optional[int] = None
    day: Optional[int] = None
    pascha_offset: Optional[int] = None
    title_csy: str
    title_fr: Optional[str] = None
    title_en: Optional[str] = None
    title_ru: Optional[str] = None
    saint_id: Optional[int] = None
    rank: str
    tone: Optional[int] = None
    fasting: str
    forefeast_days: int
    afterfeast_days: int
    service_template_id: Optional[int] = None
    rubric: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
