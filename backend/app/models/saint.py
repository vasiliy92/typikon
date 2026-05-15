"""Saint model — multilingual names, lives, icons, categories."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin
from .enums import SaintCategory


class Saint(Base, TimestampMixin):
    """Orthodox saint with multilingual metadata.

    Architecture supports:
    - Multilingual name and life summary (CSY, FR, EN)
    - Icon URL (external or uploaded)
    - Multiple categories (martyr, confessor, etc.) stored as JSON array
    - Multiple feast days via CalendarEntry.saint_id relationship
    """
    __tablename__ = "saints"
    __table_args__ = (
        {"comment": "Orthodox saints with multilingual metadata"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)

    # Multilingual names
    name_csy: Mapped[str] = mapped_column(String(500))
    name_fr: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    name_en: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)

    # Multilingual life summaries
    life_summary_csy: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    life_summary_fr: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    life_summary_en: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)

    # Icon URLs
    icon_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    icon_thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)

    # Categories as JSON array
    categories: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)

    # Year of repose / martyrdom
    reposed_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
