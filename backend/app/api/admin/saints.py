"""Admin API — Saint CRUD."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.saint import Saint
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.saint import SaintCreate, SaintResponse, SaintUpdate
from app.services.db import get_session

router = APIRouter(prefix="/saints", tags=["admin-saints"])


@router.get("", response_model=PaginatedResponse[SaintResponse])
async def list_saints(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    category: str | None = None,
    db: AsyncSession = Depends(get_session),
):
    stmt = select(Saint)
    count_stmt = select(func.count(Saint.id))

    if category:
        stmt = stmt.where(Saint.category == category)
        count_stmt = count_stmt.where(Saint.category == category)

    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.offset((page - 1) * page_size).limit(page_size).order_by(Saint.id)
    items = list((await db.execute(stmt)).scalars().all())

    return PaginatedResponse(
        items=[SaintResponse.model_validate(s) for s in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{saint_id}", response_model=SaintResponse)
async def get_saint(saint_id: int, db: AsyncSession = Depends(get_session)):
    saint = await db.get(Saint, saint_id)
    if not saint:
        raise HTTPException(404, "Saint not found")
    return SaintResponse.model_validate(saint)


@router.post("", response_model=SaintResponse, status_code=201)
async def create_saint(
    data: SaintCreate,
    db: AsyncSession = Depends(get_session),
):
    saint = Saint(**data.model_dump())
    db.add(saint)
    await db.commit()
    await db.refresh(saint)
    return SaintResponse.model_validate(saint)


@router.put("/{saint_id}", response_model=SaintResponse)
async def update_saint(
    saint_id: int,
    data: SaintUpdate,
    db: AsyncSession = Depends(get_session),
):
    saint = await db.get(Saint, saint_id)
    if not saint:
        raise HTTPException(404, "Saint not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(saint, key, value)
    await db.commit()
    await db.refresh(saint)
    return SaintResponse.model_validate(saint)


@router.delete("/{saint_id}", response_model=MessageResponse)
async def delete_saint(saint_id: int, db: AsyncSession = Depends(get_session)):
    saint = await db.get(Saint, saint_id)
    if not saint:
        raise HTTPException(404, "Saint not found")
    await db.delete(saint)
    await db.commit()
    return MessageResponse(message=f"Saint {saint_id} deleted")
