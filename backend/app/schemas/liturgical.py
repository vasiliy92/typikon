"""Pydantic schemas for liturgical text CRUD, templates, and import."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ── ServiceBlock ──────────────────────────────────────────────────────

class ServiceBlockCreate(BaseModel):
    book_code: str
    location_key: str
    slot: str
    slot_order: int = 1
    language: str = "csy"
    translation_group_id: Optional[str] = None
    title: Optional[str] = None
    content: str
    tone: Optional[str] = None
    rank: Optional[int] = None
    is_doxastikon: bool = False
    is_theotokion: bool = False
    is_irmos: bool = False
    is_katabasia: bool = False
    source_ref: Optional[str] = None
    rubric: Optional[str] = None


class ServiceBlockUpdate(BaseModel):
    location_key: Optional[str] = None
    slot: Optional[str] = None
    slot_order: Optional[int] = None
    language: Optional[str] = None
    translation_group_id: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    tone: Optional[str] = None
    rank: Optional[int] = None
    is_doxastikon: Optional[bool] = None
    is_theotokion: Optional[bool] = None
    is_irmos: Optional[bool] = None
    is_katabasia: Optional[bool] = None
    source_ref: Optional[str] = None
    rubric: Optional[str] = None


class ServiceBlockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    book_code: str
    location_key: str
    slot: str
    slot_order: int
    language: str
    translation_group_id: Optional[str] = None
    title: Optional[str] = None
    content: str
    tone: Optional[str] = None
    rank: Optional[int] = None
    is_doxastikon: bool
    is_theotokion: bool
    is_irmos: bool
    is_katabasia: bool
    source_ref: Optional[str] = None
    rubric: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── ServiceTemplate ───────────────────────────────────────────────────

class TemplateBlockCreate(BaseModel):
    block_order: int
    slot_key: str
    block_type: str
    fixed_content_key: Optional[str] = None
    variable_sources: Optional[list[str]] = None
    required: bool = True
    rubric: Optional[str] = None
    typikon_ref: Optional[str] = None
    condition: Optional[dict] = None


class TemplateBlockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    template_id: int
    block_order: int
    slot_key: str
    block_type: str
    fixed_content_key: Optional[str] = None
    variable_sources: Optional[list] = None
    required: bool
    rubric: Optional[str] = None
    typikon_ref: Optional[str] = None
    condition: Optional[dict] = None


class TemplateCreate(BaseModel):
    service_type: str
    name: str
    sub_type: Optional[str] = None
    is_special: bool = False
    trigger_condition: Optional[dict] = None
    description: Optional[str] = None


class TemplateUpdate(BaseModel):
    service_type: Optional[str] = None
    name: Optional[str] = None
    sub_type: Optional[str] = None
    is_special: Optional[bool] = None
    trigger_condition: Optional[dict] = None
    description: Optional[str] = None


class TemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    service_type: str
    name: str
    sub_type: Optional[str] = None
    is_special: bool
    trigger_condition: Optional[dict] = None
    description: Optional[str] = None
    blocks: list[TemplateBlockResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Lection ───────────────────────────────────────────────────────────

class LectionCreate(BaseModel):
    book_code: str
    zachalo: int
    language: str = "csy"
    title: str
    content: str
    short_ref: str


class LectionUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    short_ref: Optional[str] = None


class LectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    book_code: str
    zachalo: int
    language: str
    title: str
    content: str
    short_ref: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Import ────────────────────────────────────────────────────────────

class ImportResult(BaseModel):
    status: str = "ok"
    total_created: int = 0
    total_errors: int = 0
    details: dict[str, dict] = {}


# ── Book info ─────────────────────────────────────────────────────────

class BookInfo(BaseModel):
    code: str
    name_csy: str
    name_fr: str
    name_en: str
    block_count: int = 0
    languages: list[str] = []
