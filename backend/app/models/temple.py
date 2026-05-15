"""Temple and SideChapel models."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import CalendarMode, DedicationType, Language


class Temple(Base, TimestampMixin):
    __tablename__ = "temples"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    dedication_type: Mapped[DedicationType] = mapped_column(String(20))
    patron_feast_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    patron_feast_day: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    calendar_mode: Mapped[CalendarMode] = mapped_column(String(20), default=CalendarMode.NEO_JULIAN)
    language: Mapped[Language] = mapped_column(String(5), default=Language.CSY)

    side_chapels: Mapped[list["SideChapel"]] = relationship(back_populates="temple", init=False)


class SideChapel(Base, TimestampMixin):
    __tablename__ = "side_chapels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    temple_id: Mapped[int] = mapped_column(ForeignKey("temples.id"))
    name: Mapped[str] = mapped_column(String(255))
    dedication_type: Mapped[DedicationType] = mapped_column(String(20))
    patron_feast_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    patron_feast_day: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)

    temple: Mapped["Temple"] = relationship(back_populates="side_chapels", init=False)
