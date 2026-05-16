"""Saint model — multilingual names, lives, icons, categories."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class Saint(Base, TimestampMixin):
    """Orthodox saint with multilingual metadata.

    Architecture supports:
    - Multilingual name and life summary (FR, RU)
    - RU liturgical texts are Church Slavonic in civil (гражданский) script
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

    # Multilingual names — name_ru is required (CSY civil script for liturgical)
    name_ru: Mapped[str] = mapped_column(String(500))
    name_fr: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)

    # Multilingual life summaries
    life_summary_ru: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    life_summary_fr: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)

    # Troparion and Kontakion (multilingual)
    troparion_ru: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    troparion_fr: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    troparion_tone: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, default=None)
    kontakion_ru: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    kontakion_fr: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    kontakion_tone: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, default=None)

    # Icon — URL to image (external CDN or local upload path)
    icon_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    icon_thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)

    # Categories as JSON array of SaintCategory values
    categories: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)

    # Year of repose / martyrdom (approximate, for sorting/display)
    reposed_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)