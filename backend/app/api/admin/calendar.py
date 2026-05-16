"""Admin API — CalendarEntry CRUD."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.calendar import CalendarEntry
from app.schemas.calendar import CalendarEntryCreate, CalendarEntryResponse, CalendarEntryUpdate
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.db import get_session

router = APIRouter(prefix="/calendar", tags=["admin-calendar"])


@router.get("", response_model=PaginatedResponse[CalendarEntryResponse])
async def list_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    date_type: str | None = None,
    month: int | None = None,
    service_type: str | None = None,
    db: AsyncSession = Depends(get_session),
):
    stmt = select(CalendarEntry)
    count_stmt = select(func.count(CalendarEntry.id))

    if date_type:
        stmt = stmt.where(CalendarEntry.date_type == date_type)
        count_stmt = count_stmt.where(CalendarEntry.date_type == date_type)
    if month:
        stmt = stmt.where(CalendarEntry.month == month)
        count_stmt = count_stmt.where(CalendarEntry.month == month)
    if service_type:
        stmt = stmt.where(CalendarEntry.service_type == service_type)
        count_stmt = count_stmt.where(CalendarEntry.service_type == service_type)

    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.offset((page - 1) * page_size).limit(page_size).order_by(CalendarEntry.id)
    items = list((await db.execute(stmt)).scalars().all())

    return PaginatedResponse.create(
        items=[CalendarEntryResponse.model_validate(e) for e in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{entry_id}", response_model=CalendarEntryResponse)
async def get_entry(entry_id: int, db: AsyncSession = Depends(get_session)):
    entry = await db.get(CalendarEntry, entry_id)
    if not entry:
        raise HTTPException(404, "CalendarEntry not found")
    return CalendarEntryResponse.model_validate(entry)


@router.post("", response_model=CalendarEntryResponse, status_code=201)
async def create_entry(
    data: CalendarEntryCreate,
    db: AsyncSession = Depends(get_session),
):
    entry = CalendarEntry(**data.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return CalendarEntryResponse.model_validate(entry)


@router.put("/{entry_id}", response_model=CalendarEntryResponse)
async def update_entry(
    entry_id: int,
    data: CalendarEntryUpdate,
    db: AsyncSession = Depends(get_session),
):
    entry = await db.get(CalendarEntry, entry_id)
    if not entry:
        raise HTTPException(404, "CalendarEntry not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(entry, key, value)
    await db.commit()
    await db.refresh(entry)
    return CalendarEntryResponse.model_validate(entry)


@router.delete("/{entry_id}", response_model=MessageResponse)
async def delete_entry(entry_id: int, db: AsyncSession = Depends(get_session)):
    entry = await db.get(CalendarEntry, entry_id)
    if not entry:
        raise HTTPException(404, "CalendarEntry not found")
    await db.delete(entry)
    await db.commit()
    return MessageResponse(message=f"CalendarEntry {entry_id} deleted")