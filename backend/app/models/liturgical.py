"""Core liturgical data models — ServiceBlock, templates, lections, cache."""
from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import (
    Boolean, Date, ForeignKey, Index, Integer, JSON, String, Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import BlockType, BookCode, Language, ServiceType


class ServiceBlock(Base, TimestampMixin):
    """Every piece of liturgical text stored as the smallest unit that fills
    one slot in one service."""
    __tablename__ = "service_blocks"
    __table_args__ = (
        UniqueConstraint(
            "book_code", "location_key", "slot", "slot_order", "language",
            name="uq_service_block",
        ),
        Index("ix_block_book_loc", "book_code", "location_key"),
        Index("ix_block_slot", "slot"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    book_code: Mapped[BookCode] = mapped_column(String(30))
    location_key: Mapped[str] = mapped_column(String(120))
    slot: Mapped[str] = mapped_column(String(80))
    slot_order: Mapped[int] = mapped_column(Integer, default=1)
    language: Mapped[Language] = mapped_column(String(5))
    translation_group_id: Mapped[Optional[str]] = mapped_column(
        String(36), nullable=True, default=None, index=True,
    )
    title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    content: Mapped[str] = mapped_column(Text)
    tone: Mapped[Optional[str]] = mapped_column(String(2), nullable=True, default=None)
    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    is_doxastikon: Mapped[bool] = mapped_column(Boolean, default=False)
    is_theotokion: Mapped[bool] = mapped_column(Boolean, default=False)
    is_irmos: Mapped[bool] = mapped_column(Boolean, default=False)
    is_katabasia: Mapped[bool] = mapped_column(Boolean, default=False)
    source_ref: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, default=None)
    rubric: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)


class ServiceTemplate(Base, TimestampMixin):
    """Defines the order and slots of a service type."""
    __tablename__ = "service_templates"
    __table_args__ = (
        UniqueConstraint("service_type", "sub_type", name="uq_template_type"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    service_type: Mapped[ServiceType] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(255))
    sub_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default=None)
    is_special: Mapped[bool] = mapped_column(Boolean, default=False)
    trigger_condition: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=None)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)

    blocks: Mapped[list["ServiceTemplateBlock"]] = relationship(
        back_populates="template", order_by="ServiceTemplateBlock.block_order",
    )


class ServiceTemplateBlock(Base, TimestampMixin):
    """One slot in a service template."""
    __tablename__ = "service_template_blocks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    template_id: Mapped[int] = mapped_column(ForeignKey("service_templates.id"))
    block_order: Mapped[int] = mapped_column(Integer)
    slot_key: Mapped[str] = mapped_column(String(80))
    block_type: Mapped[BlockType] = mapped_column(String(20))
    fixed_content_key: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, default=None)
    variable_sources: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=None)
    required: Mapped[bool] = mapped_column(Boolean, default=True)
    rubric: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    typikon_ref: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default=None)
    condition: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=None)

    template: Mapped["ServiceTemplate"] = relationship(back_populates="blocks")


class SpecialServiceContent(Base, TimestampMixin):
    """Complete text blocks for special service orders."""
    __tablename__ = "special_service_content"
    __table_args__ = (
        UniqueConstraint("template_id", "block_order", "language", name="uq_special_content"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    template_id: Mapped[int] = mapped_column(ForeignKey("service_templates.id"))
    block_order: Mapped[int] = mapped_column(Integer)
    slot_key: Mapped[str] = mapped_column(String(80))
    title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    content: Mapped[str] = mapped_column(Text)
    rubric: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    language: Mapped[Language] = mapped_column(String(5))
    variable_slots: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=None)


class Lection(Base, TimestampMixin):
    """Scripture readings: Gospel, Apostol, OT paremia."""
    __tablename__ = "lections"
    __table_args__ = (
        UniqueConstraint("book_code", "zachalo", "language", name="uq_lection"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    book_code: Mapped[BookCode] = mapped_column(String(30))
    zachalo: Mapped[int] = mapped_column(Integer)
    language: Mapped[Language] = mapped_column(String(5))
    title: Mapped[str] = mapped_column(String(500))
    content: Mapped[str] = mapped_column(Text)
    short_ref: Mapped[str] = mapped_column(String(200))


class LectionAssignment(Base, TimestampMixin):
    """Maps a lection to a service on a specific liturgical day."""
    __tablename__ = "lection_assignments"
    __table_args__ = (
        Index("ix_lection_asgn_date", "moveable_key", "fixed_month", "fixed_day"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    service_type: Mapped[ServiceType] = mapped_column(String(20))
    moveable_key: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default=None)
    fixed_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    fixed_day: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    lection_book: Mapped[BookCode] = mapped_column(String(30))
    zachalo: Mapped[int] = mapped_column(Integer)
    reading_order: Mapped[int] = mapped_column(Integer, default=1)
    is_paremia: Mapped[bool] = mapped_column(Boolean, default=False)
    language: Mapped[Language] = mapped_column(String(5))


class AssembledService(Base, TimestampMixin):
    """Pre-computed assembled service for a given day/temple/language."""
    __tablename__ = "assembled_services"
    __table_args__ = (
        UniqueConstraint(
            "service_date", "service_type", "temple_id", "language",
            name="uq_assembled_service",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    service_date: Mapped[date] = mapped_column(Date)
    service_type: Mapped[ServiceType] = mapped_column(String(20))
    temple_id: Mapped[int] = mapped_column(ForeignKey("temples.id"))
    language: Mapped[Language] = mapped_column(String(5))
    calendar_style: Mapped[str] = mapped_column(String(10), default="new")
    content_json: Mapped[str] = mapped_column(Text)
    ustav_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True)