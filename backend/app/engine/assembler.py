"""Typikon Engine — Service Assembler.

Assembles a complete liturgical service by combining:
  1. Fixed calendar entries (Menaion)
  2. Movable calendar entries (Triodion / Pentecostarion)
  3. Temple patron troparia/kontakia
  4. Service template blocks (ordinary / festal)
  5. Markov chapter overrides
  6. Lection assignments (Gospel, Apostol, OT paremia)

The assembler follows the Typikon rules for ordering and inclusion.
"""
from __future__ import annotations

import json
from datetime import date
from enum import StrEnum
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.calendar import LiturgicalCalendar, LiturgicalPeriod
from app.models.calendar import CalendarEntry, MarkovRule
from app.models.liturgical import (
    AssembledService,
    Lection,
    LectionAssignment,
    ServiceBlock,
    ServiceTemplate,
    ServiceTemplateBlock,
)
from app.models.saint import Saint
from app.models.temple import Temple


class AssemblyMode(StrEnum):
    FULL = "full"
    USTAV = "ustav"


class ServiceAssembler:
    """Assembles a complete liturgical service for a given date and temple."""

    def __init__(
        self,
        db: AsyncSession,
        target_date: date,
        service_type: str,
        temple_id: int,
        language: str = "fr",
        calendar_style: str = "new",
        mode: AssemblyMode = AssemblyMode.FULL,
    ):
        self.db = db
        self.target_date = target_date
        self.service_type = service_type
        self.temple_id = temple_id
        self.language = language
        self.calendar_style = calendar_style
        self.mode = mode
        self.cal = LiturgicalCalendar(target_date, calendar_style)
        self._temple: Temple | None = None
        self._fixed_entries: list[CalendarEntry] = []
        self._movable_entries: list[CalendarEntry] = []
        self._template: ServiceTemplate | None = None
        self._markov_overrides: list[MarkovRule] = []

    async def assemble(self) -> dict[str, Any]:
        """Run the full assembly pipeline and return the assembled service."""
        await self._load_data()
        liturgical_info = self.cal.get_liturgical_day()

        feast_rank = self._determine_feast_rank()
        template_type = "festal" if feast_rank >= 4 else "ordinary"

        template = await self._select_template(template_type)
        if not template:
            return {
                "error": f"No {template_type} template found for {self.service_type}",
                "liturgical_day": liturgical_info,
            }

        ordered_blocks = await self._order_blocks(template, feast_rank)
        lections = await self._load_lections()
        patron_troparia = await self._load_patron_troparia()

        result: dict[str, Any] = {
            "date": self.target_date.isoformat(),
            "service_type": self.service_type,
            "temple_id": self.temple_id,
            "language": self.language,
            "calendar_style": self.calendar_style,
            "mode": self.mode.value,
            "liturgical_day": liturgical_info,
            "feast_rank": feast_rank,
            "template_type": template_type,
            "fixed_entries": [self._entry_summary(e) for e in self._fixed_entries],
            "movable_entries": [self._entry_summary(e) for e in self._movable_entries],
            "blocks": ordered_blocks,
            "lections": lections,
            "patron_troparia": patron_troparia,
        }

        if self.mode == AssemblyMode.FULL:
            result["blocks"] = await self._resolve_block_texts(ordered_blocks)

        await self._save_assembled_service(result)
        return result

    # ── Data loading ──────────────────────────────────────────────────

    async def _load_data(self) -> None:
        julian = self.cal.julian_date
        month, day = julian.month, julian.day

        # Fixed entries match on Julian month/day
        stmt_fixed = select(CalendarEntry).where(
            CalendarEntry.date_type == "fixed",
            CalendarEntry.month == month,
            CalendarEntry.day == day,
        )
        self._fixed_entries = list(
            (await self.db.execute(stmt_fixed)).scalars().all()
        )

        # Movable entries match on pascha_offset (= days_from_pascha)
        days_from = self.cal.days_from_pascha
        stmt_movable = select(CalendarEntry).where(
            CalendarEntry.date_type == "movable",
            CalendarEntry.pascha_offset == days_from,
        )
        self._movable_entries = list(
            (await self.db.execute(stmt_movable)).scalars().all()
        )

        # Load temple
        stmt_temple = select(Temple).where(Temple.id == self.temple_id)
        self._temple = (await self.db.execute(stmt_temple)).scalar_one_or_none()

        # Load all Markov rules for this service type, filter in Python
        stmt_markov = select(MarkovRule)
        all_markov = list(
            (await self.db.execute(stmt_markov)).scalars().all()
        )
        self._markov_overrides = [
            m for m in all_markov if self._markov_matches(m, julian)
        ]

    # ── Markov rule matching ──────────────────────────────────────────

    def _markov_matches(self, rule: MarkovRule, julian_date: date) -> bool:
        """Check if a MarkovRule's conditions match the current day.

        MarkovRule stores conditions as a JSON string in the `conditions` field.
        Expected JSON keys: month, day, days_from_pascha, day_of_week, service_type.
        """
        try:
            conditions = json.loads(rule.conditions) if rule.conditions else {}
        except (json.JSONDecodeError, TypeError):
            return False

        if conditions.get("service_type") and conditions["service_type"] != self.service_type:
            return False

        if "month" in conditions and julian_date.month != conditions["month"]:
            return False
        if "day" in conditions and julian_date.day != conditions["day"]:
            return False
        if "days_from_pascha" in conditions:
            if self.cal.days_from_pascha != conditions["days_from_pascha"]:
                return False
        if "day_of_week" in conditions:
            # day_of_week in conditions is 0=Sunday..6=Saturday (Python weekday+1 mod 7)
            dow = (self.cal.gregorian_date.weekday() + 1) % 7
            if dow != conditions["day_of_week"]:
                return False

        return True

    # ── Feast rank ────────────────────────────────────────────────────

    def _determine_feast_rank(self) -> int:
        """Determine the highest feast rank from fixed and movable entries.

        FeastRank values: DAILY="1", MINOR_SAINT="2", POLYELEOS="3", VIGIL="4", LORD_THEOTOKOS="5"
        """
        max_rank = 1
        for entry in self._fixed_entries + self._movable_entries:
            try:
                rank_val = int(entry.rank)
                if rank_val > max_rank:
                    max_rank = rank_val
            except (ValueError, TypeError):
                pass
        return max_rank

    # ── Template selection ────────────────────────────────────────────

    async def _select_template(self, template_type: str) -> ServiceTemplate | None:
        """Select a service template matching the service type and sub_type."""
        stmt = select(ServiceTemplate).where(
            ServiceTemplate.service_type == self.service_type,
            ServiceTemplate.sub_type == template_type,
        ).limit(1)
        return (await self.db.execute(stmt)).scalar_one_or_none()

    # ── Block ordering ────────────────────────────────────────────────

    async def _order_blocks(
        self, template: ServiceTemplate, feast_rank: int,
    ) -> list[dict[str, Any]]:
        """Load template blocks in order and apply Markov overrides."""
        stmt = (
            select(ServiceTemplateBlock)
            .where(ServiceTemplateBlock.template_id == template.id)
            .order_by(ServiceTemplateBlock.block_order)
        )
        blocks = list((await self.db.execute(stmt)).scalars().all())

        result = []
        for b in blocks:
            block_dict = {
                "slot_key": b.slot_key,
                "block_order": b.block_order,
                "block_type": b.block_type,
                "fixed_content_key": b.fixed_content_key,
                "variable_sources": b.variable_sources,
                "required": b.required,
                "rubric": b.rubric,
                "condition": b.condition,
                "content": None,
                "title": None,
            }
            result.append(block_dict)

        # Apply Markov overrides
        for override in self._markov_overrides:
            result = self._apply_markov(result, override)

        return result

    def _apply_markov(
        self, blocks: list[dict], rule: MarkovRule,
    ) -> list[dict]:
        """Apply a Markov rule override to the block list.

        MarkovRule stores overrides as JSON in the `overrides` field.
        Expected JSON keys: action ("insert"|"remove"|"replace"),
        after_slot_key, slot_key, replacement_slot_key, content, rubric.
        """
        try:
            overrides = json.loads(rule.overrides) if rule.overrides else {}
        except (json.JSONDecodeError, TypeError):
            return blocks

        action = overrides.get("action")

        if action == "insert" and overrides.get("after_slot_key"):
            new_block = {
                "slot_key": overrides.get("slot_key", "markov_insert"),
                "block_order": 0,
                "block_type": "variable",
                "fixed_content_key": None,
                "variable_sources": None,
                "required": True,
                "rubric": overrides.get("rubric"),
                "condition": None,
                "content": overrides.get("content"),
                "title": overrides.get("title"),
                "markov_rule_id": rule.id,
            }
            for i, b in enumerate(blocks):
                if b["slot_key"] == overrides["after_slot_key"]:
                    blocks.insert(i + 1, new_block)
                    break

        elif action == "remove":
            target_slot = overrides.get("slot_key")
            if target_slot:
                blocks = [b for b in blocks if b["slot_key"] != target_slot]

        elif action == "replace":
            target_slot = overrides.get("slot_key")
            replacement = overrides.get("replacement_slot_key")
            if target_slot and replacement:
                for b in blocks:
                    if b["slot_key"] == target_slot:
                        b["slot_key"] = replacement
                        b["markov_rule_id"] = rule.id

        return blocks

    # ── Block text resolution ─────────────────────────────────────────

    async def _resolve_block_texts(
        self, blocks: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Fill in actual text content for blocks that have fixed_content_key."""
        # Collect all content keys that need resolution
        content_keys = [
            b["fixed_content_key"] for b in blocks if b.get("fixed_content_key")
        ]
        if not content_keys:
            return blocks

        # Look up ServiceBlocks by location_key
        stmt = select(ServiceBlock).where(
            ServiceBlock.location_key.in_(content_keys),
            ServiceBlock.language == self.language,
        )
        block_map: dict[str, ServiceBlock] = {
            b.location_key: b for b in (await self.db.execute(stmt)).scalars().all()
        }

        # Fallback to RU if requested language not found
        if not block_map and self.language != "ru":
            stmt_ru = select(ServiceBlock).where(
                ServiceBlock.location_key.in_(content_keys),
                ServiceBlock.language == "ru",
            )
            block_map = {
                b.location_key: b for b in (await self.db.execute(stmt_ru)).scalars().all()
            }

        for b in blocks:
            key = b.get("fixed_content_key")
            if key and key in block_map:
                sb = block_map[key]
                b["content"] = sb.content
                b["title"] = sb.title
                b["book_code"] = sb.book_code
                b["tone"] = sb.tone

                # Try to find translation if language differs
                if self.language != sb.language and sb.translation_group_id:
                    translated = await self._find_translation(
                        sb.translation_group_id, self.language,
                    )
                    if translated:
                        b["content_translated"] = translated.content
                        b["title_translated"] = translated.title

        return blocks

    async def _find_translation(
        self, translation_group_id: str, language: str,
    ) -> ServiceBlock | None:
        stmt = select(ServiceBlock).where(
            ServiceBlock.translation_group_id == translation_group_id,
            ServiceBlock.language == language,
        ).limit(1)
        return (await self.db.execute(stmt)).scalar_one_or_none()

    # ── Lection loading ───────────────────────────────────────────────

    async def _load_lections(self) -> dict[str, list[dict]]:
        """Load scripture readings for the current day.

        LectionAssignment uses:
        - fixed_month + fixed_day for fixed-date assignments
        - moveable_key for movable assignments (e.g. "pascha+1", "lent-3")
        - lection_book for the book type (gospel, apostol, etc.)
        - zachalo for the reading number
        """
        result: dict[str, list[dict]] = {}

        julian = self.cal.julian_date

        # Fixed assignments
        stmt_fixed = (
            select(LectionAssignment, Lection)
            .join(Lection, LectionAssignment.zachalo == Lection.zachalo)
            .where(
                LectionAssignment.service_type == self.service_type,
                LectionAssignment.fixed_month == julian.month,
                LectionAssignment.fixed_day == julian.day,
                LectionAssignment.language == Lection.language,
            )
        )
        rows = (await self.db.execute(stmt_fixed)).all()
        for assignment, lection in rows:
            key = assignment.lection_book
            result.setdefault(key, []).append(
                self._lection_dict(lection, assignment)
            )

        # Movable assignments — match by moveable_key
        # Build the moveable_key from the pascha offset
        moveable_key = self._build_moveable_key()
        if moveable_key:
            stmt_movable = (
                select(LectionAssignment, Lection)
                .join(Lection, LectionAssignment.zachalo == Lection.zachalo)
                .where(
                    LectionAssignment.service_type == self.service_type,
                    LectionAssignment.moveable_key == moveable_key,
                    LectionAssignment.language == Lection.language,
                )
            )
            rows = (await self.db.execute(stmt_movable)).all()
            for assignment, lection in rows:
                key = assignment.lection_book
                result.setdefault(key, []).append(
                    self._lection_dict(lection, assignment)
                )

        return result

    def _build_moveable_key(self) -> str | None:
        """Build a moveable_key string from the current liturgical position.

        Examples: "pascha", "pascha+1", "lent-3", "pentecost+7"
        """
        days_from = self.cal.days_from_pascha
        if days_from == 0:
            return "pascha"
        if days_from > 0:
            return f"pascha+{days_from}"
        # During pre-Lent / Lent / Holy Week
        return f"lent{days_from}"

    def _lection_dict(self, lection: Lection, assignment: LectionAssignment) -> dict:
        return {
            "lection_id": lection.id,
            "book_code": lection.book_code,
            "zachalo": lection.zachalo,
            "title": lection.title,
            "short_ref": lection.short_ref,
            "content": lection.content if self.mode == AssemblyMode.FULL else None,
            "reading_order": assignment.reading_order,
            "is_paremia": assignment.is_paremia,
        }

    # ── Patron troparia ───────────────────────────────────────────────

    async def _load_patron_troparia(self) -> dict[str, Any]:
        """Load temple patron saint troparia and kontakia.

        Uses Temple.patronsaint_id (FK→saints.id) and Temple.dedication_type.
        DedicationType: lord, theotokos, saint — affects ordering per Typikon Ch. 52.

        Troparia/kontakia are stored directly on the Saint model.
        Falls back to ServiceBlock lookup for backwards compatibility.
        """
        if not self._temple or not self._temple.patronsaint_id:
            return {"has_patron": False}

        saint = await self.db.get(Saint, self._temple.patronsaint_id)
        if not saint:
            return {"has_patron": False}

        troparion = None
        kontakion = None

        # Try Saint model fields first (preferred)
        lang = self.language  # "fr" or "ru"

        # Get troparion in requested language, fallback to other language
        trop_text = getattr(saint, f"troparion_{lang}", None)
        if not trop_text and lang != "ru":
            trop_text = saint.troparion_ru
        if not trop_text and lang != "fr":
            trop_text = saint.troparion_fr
        if trop_text:
            troparion = {"text": trop_text, "tone": saint.troparion_tone}

        # Get kontakion in requested language, fallback to other language
        kont_text = getattr(saint, f"kontakion_{lang}", None)
        if not kont_text and lang != "ru":
            kont_text = saint.kontakion_ru
        if not kont_text and lang != "fr":
            kont_text = saint.kontakion_fr
        if kont_text:
            kontakion = {"text": kont_text, "tone": saint.kontakion_tone}

        # Fallback to ServiceBlock lookup if Saint fields are empty
        if not troparion or not kontakion:
            for slot, key_suffix in [("troparion", "troparion"), ("kontakion", "kontakion")]:
                if (slot == "troparion" and troparion) or (slot == "kontakion" and kontakion):
                    continue  # Already have it from Saint model
                loc_key = f"saint-{saint.slug}-{key_suffix}"
                stmt = select(ServiceBlock).where(
                    ServiceBlock.location_key == loc_key,
                    ServiceBlock.language == self.language,
                ).limit(1)
                block = (await self.db.execute(stmt)).scalar_one_or_none()
                if not block and self.language != "ru":
                    stmt_ru = select(ServiceBlock).where(
                        ServiceBlock.location_key == loc_key,
                        ServiceBlock.language == "ru",
                    ).limit(1)
                    block = (await self.db.execute(stmt_ru)).scalar_one_or_none()
                if block:
                    entry = {"text": block.content, "tone": block.tone}
                    if slot == "troparion":
                        troparion = entry
                    else:
                        kontakion = entry

        # Get saint name in requested language
        name = getattr(saint, f"name_{lang}", None) or saint.name_ru or saint.name_fr

        return {
            "has_patron": True,
            "saint_name": name,
            "dedication_type": self._temple.dedication_type,
            "troparion": troparion,
            "kontakion": kontakion,
        }

    # ── Persistence ───────────────────────────────────────────────────

    async def _save_assembled_service(self, result: dict) -> None:
        record = AssembledService(
            service_date=self.target_date,
            service_type=self.service_type,
            temple_id=self.temple_id,
            language=self.language,
            calendar_style=self.calendar_style,
            content_json=json.dumps(result, default=str, ensure_ascii=False),
        )
        self.db.add(record)
        await self.db.commit()

    # ── Helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _entry_summary(entry: CalendarEntry) -> dict:
        """Summarize a CalendarEntry for the assembled output."""
        return {
            "id": entry.id,
            "title_ru": entry.title_ru,
            "title_fr": entry.title_fr,
            "rank": entry.rank,
            "tone": entry.tone,
            "fasting": entry.fasting,
            "saint_id": entry.saint_id,
            "rubric": entry.rubric,
        }