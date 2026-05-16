"""Calendar entry models — fixed/movable feasts, kathisma rules, Markov overrides."""
from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import (
    Date, ForeignKey, Index, Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin
from .enums import DateType, FastingType, FeastRank, ServiceType


class CalendarEntry(Base, TimestampMixin):
    """A liturgical calendar entry — either a fixed feast (month/day) or
    a movable one (offset from Pascha)."""
    __tablename__ = "calendar_entries"
    __table_args__ = (
        UniqueConstraint("date_type", "month", "day", "pascha_offset", name="uq_calendar_entry"),
        Index("ix_calentry_fixed", "month", "day"),
        Index("ix_calentry_movable", "pascha_offset"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date_type: Mapped[DateType] = mapped_column(String(10))
    month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    day: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    pascha_offset: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    title_csy: Mapped[str] = mapped_column(String(500))
    title_fr: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    title_en: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    saint_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("saints.id", ondelete="SET NULL"),
        nullable=True, default=None,
    )
    rank: Mapped[str] = mapped_column(String(2), default=FeastRank.DAILY)
    tone: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    fasting: Mapped[FastingType] = mapped_column(String(20), default=FastingType.NONE)
    forefeast_days: Mapped[int] = mapped_column(Integer, default=0)
    afterfeast_days: Mapped[int] = mapped_column(Integer, default=0)
    service_template_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("service_templates.id", ondelete="SET NULL"),
        nullable=True, default=None,
    )
    rubric: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)


class KathismaRule(Base, TimestampMixin):
    """Psalter kathisma assignments per Typikon Ch. 17."""
    __tablename__ = "kathisma_rules"
    __table_args__ = (
        UniqueConstraint("period", "day_of_week", "service_type", name="uq_kathisma_rule"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    period: Mapped[str] = mapped_column(String(50))
    day_of_week: Mapped[int] = mapped_column(Integer)
    service_type: Mapped[ServiceType] = mapped_column(String(20))
    kathismata: Mapped[str] = mapped_column(String(100))


class MarkovRule(Base, TimestampMixin):
    """Markov chapter overrides — specific date/feast coincidences."""
    __tablename__ = "markov_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rule_key: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str] = mapped_column(Text)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    conditions: Mapped[str] = mapped_column(Text)
    overrides: Mapped[str] = mapped_column(Text)
    typikon_ref: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default=None)