"""Pydantic schemas for CalendarEntry CRUD operations."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.enums import DateType, FastingType, FeastRank


class CalendarEntryCreate(BaseModel):
    date_type: str  # fixed | movable
    month: Optional[int] = None
    day: Optional[int] = None
    pascha_offset: Optional[int] = None
    title_ru: str
    title_fr: Optional[str] = None
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
        try:
            DateType(v)
        except ValueError:
            valid = ", ".join(e.value for e in DateType)
            raise ValueError(f"Invalid date_type: '{v}'. Valid values: {valid}")
        return v

    @field_validator("rank")
    @classmethod
    def validate_rank(cls, v: str) -> str:
        try:
            FeastRank(v)
        except ValueError:
            valid = ", ".join(e.value for e in FeastRank)
            raise ValueError(f"Invalid rank: '{v}'. Valid values: {valid}")
        return v

    @field_validator("fasting")
    @classmethod
    def validate_fasting(cls, v: str) -> str:
        try:
            FastingType(v)
        except ValueError:
            valid = ", ".join(e.value for e in FastingType)
            raise ValueError(f"Invalid fasting: '{v}'. Valid values: {valid}")
        return v


class CalendarEntryUpdate(BaseModel):
    date_type: Optional[str] = None
    month: Optional[int] = None
    day: Optional[int] = None
    pascha_offset: Optional[int] = None
    title_ru: Optional[str] = None
    title_fr: Optional[str] = None
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
    title_ru: str
    title_fr: Optional[str] = None
    saint_id: Optional[int] = None
    rank: str = "1"
    tone: Optional[int] = None
    fasting: str = "none"
    forefeast_days: int = 0
    afterfeast_days: int = 0
    service_template_id: Optional[int] = None
    rubric: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
