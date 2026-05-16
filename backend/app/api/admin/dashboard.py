"""Admin API — Dashboard statistics."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.calendar import CalendarEntry
from app.models.liturgical import ServiceBlock, ServiceTemplate
from app.models.saint import Saint
from app.services.db import get_session

router = APIRouter(prefix="/dashboard", tags=["admin-dashboard"])


class DashboardStats(BaseModel):
    total_blocks: int
    total_saints: int
    total_templates: int
    total_calendar_entries: int


@router.get("", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_session),
):
    """Return aggregate counts for the admin dashboard."""
    blocks_count = (await db.execute(select(func.count(ServiceBlock.id)))).scalar() or 0
    saints_count = (await db.execute(select(func.count(Saint.id)))).scalar() or 0
    templates_count = (await db.execute(select(func.count(ServiceTemplate.id)))).scalar() or 0
    calendar_count = (await db.execute(select(func.count(CalendarEntry.id)))).scalar() or 0

    return DashboardStats(
        total_blocks=blocks_count,
        total_saints=saints_count,
        total_templates=templates_count,
        total_calendar_entries=calendar_count,
    )