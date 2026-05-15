"""Admin API — JSON import endpoint for bulk data loading."""
from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.calendar import CalendarEntry
from app.models.liturgical import Lection, LectionAssignment, ServiceBlock, ServiceTemplate, ServiceTemplateBlock
from app.models.saint import Saint
from app.schemas.liturgical import ImportResult
from app.services.db import get_session

router = APIRouter(prefix="/import", tags=["admin-import"])

_MODEL_MAP: dict[str, type] = {
    "blocks": ServiceBlock,
    "calendar_entries": CalendarEntry,
    "saints": Saint,
    "lections": Lection,
    "lection_assignments": LectionAssignment,
    "templates": ServiceTemplate,
    "template_blocks": ServiceTemplateBlock,
}


@router.post("/json", response_model=ImportResult)
async def import_json(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_session),
):
    """Import liturgical data from a JSON file.

    Expected format:
    {
      "blocks": [...],
      "calendar_entries": [...],
      "saints": [...],
      "lections": [...],
      "lection_assignments": [...],
      "templates": [...],
      "template_blocks": [...]
    }
    Each key is optional. Only present keys will be processed.
    """
    content = await file.read()
    data: dict[str, Any] = json.loads(content)

    total_created = 0
    total_errors = 0
    details: dict[str, dict] = {}

    for key, records in data.items():
        model_class = _MODEL_MAP.get(key)
        if not model_class or not isinstance(records, list):
            continue

        created = 0
        errors = 0
        for record in records:
            try:
                obj = model_class(**record)
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


@router.post("/json/validate")
async def validate_json(
    file: UploadFile = File(...),
):
    """Validate a JSON import file without actually importing.

    Returns a dry-run summary of what would be imported.
    """
    content = await file.read()
    data: dict[str, Any] = json.loads(content)

    summary: dict[str, int] = {}
    for key, records in data.items():
        if key in _MODEL_MAP and isinstance(records, list):
            summary[key] = len(records)

    return {"valid": True, "summary": summary}
