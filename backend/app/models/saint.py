"""Saint model — multilingual names, lives, icons, categories."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin
from .enums import SaintCategory


class Saint(Base, TimestampMixin):
    """Orthodox saint with multilingual metadata."""
    __tablename__ = "saints"
    __table_args__ = (
        {"comment": "Orthodox saints with multilingual metadata"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name_csy: Mapped[str] = mapped_column(String(500))
    name_fr: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    name_en: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    life_summary_csy: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    life_summary_fr: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    life_summary_en: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    icon_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    icon_thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    categories: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    reposed_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)