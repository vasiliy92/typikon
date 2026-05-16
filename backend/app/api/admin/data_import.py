"""Admin API — JSON import and validation endpoints for bulk data loading.

Provides two workflows:
  1. /validate  — dry-run validation without writing to DB
  2. /json      — actual import with Pydantic validation before insertion

Both accept either a file upload (multipart) or a JSON request body.
"""
from __future__ import annotations

import json
from collections import defaultdict
from typing import Any

from fastapi import APIRouter, Depends, UploadFile, File
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.calendar import CalendarEntry
from app.models.liturgical import (
    Lection,
    LectionAssignment,
    ServiceBlock,
    ServiceTemplate,
    ServiceTemplateBlock,
)
from app.models.saint import Saint
from app.schemas.calendar import CalendarEntryCreate
from app.schemas.liturgical import (
    ImportResult,
    LectionAssignmentCreate,
    LectionCreate,
    RecordError,
    ServiceBlockCreate,
    TemplateBlockCreate,
    TemplateCreate,
    TypeSummary,
    ValidationResult,
)
from app.schemas.saint import SaintCreate
from app.services.db import get_session

router = APIRouter(prefix="/import", tags=["admin-import"])

# ── Mappings ────────────────────────────────────────────────────────────

_MODEL_MAP: dict[str, type] = {
    "blocks": ServiceBlock,
    "calendar_entries": CalendarEntry,
    "saints": Saint,
    "lections": Lection,
    "lection_assignments": LectionAssignment,
    "templates": ServiceTemplate,
    "template_blocks": ServiceTemplateBlock,
}

_SCHEMA_MAP: dict[str, type] = {
    "blocks": ServiceBlockCreate,
    "calendar_entries": CalendarEntryCreate,
    "saints": SaintCreate,
    "lections": LectionCreate,
    "lection_assignments": LectionAssignmentCreate,
    "templates": TemplateCreate,
    "template_blocks": TemplateBlockCreate,
}

# Unique constraint field groups per model key.
# Each inner list is one unique constraint (composite keys supported).
_UNIQUE_CONSTRAINTS: dict[str, list[list[str]]] = {
    "blocks": [["book_code", "location_key", "slot", "slot_order", "language"]],
    "calendar_entries": [["date_type", "month", "day", "pascha_offset"]],
    "saints": [["slug"]],
    "lections": [["book_code", "zachalo", "language"]],
    "templates": [["service_type", "sub_type"]],
    # lection_assignments, template_blocks — no unique constraints
}

# FK references: model_key -> [(field_name, referenced_model_key)]
_FK_REFERENCES: dict[str, list[tuple[str, str]]] = {
    "calendar_entries": [
        ("saint_id", "saints"),
        ("service_template_id", "templates"),
    ],
    "template_blocks": [
        ("template_id", "templates"),
    ],
}


# ── Helpers ─────────────────────────────────────────────────────────────

def _add_or_append(errors_list: list[RecordError], index: int, message: str) -> None:
    """Append message to an existing RecordError at index, or create one."""
    for rec in errors_list:
        if rec.index == index:
            rec.errors.append(message)
            return
    errors_list.append(RecordError(index=index, errors=[message]))


# ── Core validation logic ──────────────────────────────────────────────

async def _validate_import_data(
    data: dict[str, Any],
    db: AsyncSession,
) -> ValidationResult:
    """Comprehensive validation of import data without writing to the DB.

    Checks performed (in order):
      1. Pydantic schema validation - types, required fields, enum values
      2. Intra-batch duplicate detection - unique constraints within the file
      3. DB duplicate detection - conflicts with existing rows
      4. FK existence checks - referenced rows exist in the DB
    """
    all_errors: dict[str, list[RecordError]] = {}
    all_warnings: dict[str, list[RecordError]] = {}
    all_summaries: dict[str, TypeSummary] = {}
    overall_valid = True

    # ── Unknown keys ────────────────────────────────────────────────
    unknown_keys = [k for k in data if k not in _MODEL_MAP]
    if unknown_keys:
        valid_keys = ", ".join(sorted(_MODEL_MAP))
        all_warnings["_metadata"] = [
            RecordError(
                index=0,
                errors=[
                    f"Unknown key(s): {', '.join(unknown_keys)}. "
                    f"Valid keys: {valid_keys}"
                ],
            )
        ]

    for key, records in data.items():
        schema_class = _SCHEMA_MAP.get(key)
        model_class = _MODEL_MAP.get(key)
        if not schema_class or not model_class or not isinstance(records, list):
            continue

        error_indices: set[int] = set()
        record_errors: list[RecordError] = []
        warning_list: list[RecordError] = []

        # ── Step 1: Pydantic schema validation ──────────────────────
        for i, record in enumerate(records):
            if not isinstance(record, dict):
                record_errors.append(
                    RecordError(index=i, errors=["Record must be a JSON object"])
                )
                error_indices.add(i)
                continue
            try:
                schema_class(**record)
            except PydanticValidationError as exc:
                msgs: list[str] = []
                for err in exc.errors():
                    loc = " -> ".join(str(l) for l in err["loc"])
                    msgs.append(f"{loc}: {err['msg']}")
                record_errors.append(RecordError(index=i, errors=msgs))
                error_indices.add(i)

        # ── Step 2: Intra-batch duplicate detection ─────────────────
        for constraint_fields in _UNIQUE_CONSTRAINTS.get(key, []):
            seen: dict[tuple, list[int]] = defaultdict(list)
            for i, record in enumerate(records):
                if i in error_indices or not isinstance(record, dict):
                    continue
                key_vals = tuple(record.get(f) for f in constraint_fields)
                # Skip if any constraint component is None
                if any(v is None for v in key_vals):
                    continue
                seen[key_vals].append(i)

            for key_vals, indices in seen.items():
                if len(indices) > 1:
                    desc = ", ".join(
                        f"{f}={v}" for f, v in zip(constraint_fields, key_vals)
                    )
                    for idx in indices:
                        _add_or_append(
                            record_errors, idx,
                            f"Duplicate within batch: {desc}",
                        )
                        error_indices.add(idx)

        # ── Step 3: DB duplicate detection ──────────────────────────
        for constraint_fields in _UNIQUE_CONSTRAINTS.get(key, []):
            # Collect unique-key values from records that passed previous checks
            key_values_map: dict[tuple, list[int]] = defaultdict(list)
            for i, record in enumerate(records):
                if i in error_indices or not isinstance(record, dict):
                    continue
                key_vals = tuple(record.get(f) for f in constraint_fields)
                if any(v is None for v in key_vals):
                    continue
                key_values_map[key_vals].append(i)

            if not key_values_map:
                continue

            if len(constraint_fields) == 1:
                # Single-field constraint - simple IN query
                field_name = constraint_fields[0]
                values = [k[0] for k in key_values_map]
                column = getattr(model_class, field_name)
                result = await db.execute(
                    select(column).where(column.in_(values))
                )
                existing_values = set(result.scalars().all())

                for val in existing_values:
                    lookup_key = (val,)
                    if lookup_key in key_values_map:
                        for idx in key_values_map[lookup_key]:
                            _add_or_append(
                                record_errors, idx,
                                f"Already exists in database: {field_name}={val!r}",
                            )
                            error_indices.add(idx)
            else:
                # Composite constraint - query by first field, filter in Python
                first_field = constraint_fields[0]
                first_values = list(
                    {k[0] for k in key_values_map if k[0] is not None}
                )
                if first_values:
                    first_column = getattr(model_class, first_field)
                    columns = [getattr(model_class, f) for f in constraint_fields]
                    result = await db.execute(
                        select(*columns).where(first_column.in_(first_values))
                    )
                    existing_rows = {tuple(row) for row in result.all()}

                    for key_vals, indices in key_values_map.items():
                        if key_vals in existing_rows:
                            desc = ", ".join(
                                f"{f}={v!r}"
                                for f, v in zip(constraint_fields, key_vals)
                            )
                            for idx in indices:
                                _add_or_append(
                                    record_errors, idx,
                                    f"Already exists in database: {desc}",
                                )
                                error_indices.add(idx)

        # ── Step 4: FK existence checks ─────────────────────────────
        for fk_field, ref_key in _FK_REFERENCES.get(key, []):
            ref_model = _MODEL_MAP.get(ref_key)
            if not ref_model:
                continue

            fk_values: dict[Any, list[int]] = defaultdict(list)
            for i, record in enumerate(records):
                if i in error_indices or not isinstance(record, dict):
                    continue
                val = record.get(fk_field)
                if val is not None:
                    fk_values[val].append(i)

            if not fk_values:
                continue

            ids_to_check = list(fk_values.keys())
            result = await db.execute(
                select(ref_model.id).where(ref_model.id.in_(ids_to_check))
            )
            existing_ids = set(result.scalars().all())

            missing_ids = set(ids_to_check) - existing_ids
            for missing_id in sorted(missing_ids):
                for idx in fk_values[missing_id]:
                    _add_or_append(
                        warning_list, idx,
                        f"{fk_field}={missing_id} not found in database "
                        f"(record will be created with dangling reference)",
                    )

        # ── Finalize per-type results ───────────────────────────────
        record_errors.sort(key=lambda e: e.index)
        warning_list.sort(key=lambda e: e.index)

        if record_errors:
            all_errors[key] = record_errors
            overall_valid = False
        if warning_list:
            all_warnings[key] = warning_list

        valid_count = len(records) - len(error_indices)
        all_summaries[key] = TypeSummary(
            total=len(records),
            valid=valid_count,
            errors=len(error_indices),
        )

    return ValidationResult(
        valid=overall_valid,
        summary=all_summaries,
        errors=all_errors,
        warnings=all_warnings,
    )


# ── Core import logic ──────────────────────────────────────────────────

async def _import_data(
    data: dict[str, Any],
    db: AsyncSession,
) -> ImportResult:
    """Import data into the database with Pydantic validation per record."""
    total_created = 0
    total_errors = 0
    details: dict[str, dict] = {}

    for key, records in data.items():
        schema_class = _SCHEMA_MAP.get(key)
        model_class = _MODEL_MAP.get(key)
        if not schema_class or not model_class or not isinstance(records, list):
            continue

        created = 0
        errors = 0

        for record in records:
            try:
                validated = schema_class(**record)
                obj = model_class(**validated.model_dump())
                db.add(obj)
                created += 1
            except Exception:
                errors += 1

        await db.flush()
        details[key] = {"created": created, "errors": errors}
        total_created += created
        total_errors += errors

    await db.commit()

    return ImportResult(
        total_created=total_created,
        total_errors=total_errors,
        details=details,
    )


# ── Endpoints: file upload ─────────────────────────────────────────────

@router.post("/json", response_model=ImportResult)
async def import_json(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_session),
):
    """Import liturgical data from a JSON file upload."""
    content = await file.read()
    data: dict[str, Any] = json.loads(content)
    return await _import_data(data, db)


@router.post("/json/validate", response_model=ValidationResult)
async def validate_json(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_session),
):
    """Validate a JSON import file without writing to DB.

    Returns per-record schema errors, intra-batch and DB duplicate
    detections, and FK existence warnings.
    """
    content = await file.read()
    data: dict[str, Any] = json.loads(content)
    return await _validate_import_data(data, db)


# ── Endpoints: JSON body ───────────────────────────────────────────────

@router.post("/batch", response_model=ImportResult)
async def import_batch(
    data: dict[str, Any],
    db: AsyncSession = Depends(get_session),
):
    """Import liturgical data from a JSON request body."""
    return await _import_data(data, db)


@router.post("/validate", response_model=ValidationResult)
async def validate_batch(
    data: dict[str, Any],
    db: AsyncSession = Depends(get_session),
):
    """Validate import data from a JSON request body without writing to DB."""
    return await _validate_import_data(data, db)
