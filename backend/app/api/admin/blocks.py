"""Admin API — ServiceBlock CRUD."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.liturgical import ServiceBlock
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.liturgical import ServiceBlockCreate, ServiceBlockResponse, ServiceBlockUpdate
from app.services.db import get_session

router = APIRouter(prefix="/blocks", tags=["admin-blocks"])


@router.get("", response_model=PaginatedResponse[ServiceBlockResponse])
async def list_blocks(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    book_code: str | None = None,
    language: str | None = None,
    db: AsyncSession = Depends(get_session),
):
    stmt = select(ServiceBlock)
    count_stmt = select(func.count(ServiceBlock.id))

    if book_code:
        stmt = stmt.where(ServiceBlock.book_code == book_code)
        count_stmt = count_stmt.where(ServiceBlock.book_code == book_code)
    if language:
        stmt = stmt.where(ServiceBlock.language == language)
        count_stmt = count_stmt.where(ServiceBlock.language == language)

    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.offset((page - 1) * page_size).limit(page_size).order_by(ServiceBlock.id)
    items = list((await db.execute(stmt)).scalars().all())

    return PaginatedResponse(
        items=[ServiceBlockResponse.model_validate(b) for b in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{block_id}", response_model=ServiceBlockResponse)
async def get_block(block_id: int, db: AsyncSession = Depends(get_session)):
    block = await db.get(ServiceBlock, block_id)
    if not block:
        raise HTTPException(404, "ServiceBlock not found")
    return ServiceBlockResponse.model_validate(block)


@router.post("", response_model=ServiceBlockResponse, status_code=201)
async def create_block(
    data: ServiceBlockCreate,
    db: AsyncSession = Depends(get_session),
):
    block = ServiceBlock(**data.model_dump())
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return ServiceBlockResponse.model_validate(block)


@router.put("/{block_id}", response_model=ServiceBlockResponse)
async def update_block(
    block_id: int,
    data: ServiceBlockUpdate,
    db: AsyncSession = Depends(get_session),
):
    block = await db.get(ServiceBlock, block_id)
    if not block:
        raise HTTPException(404, "ServiceBlock not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(block, key, value)
    await db.commit()
    await db.refresh(block)
    return ServiceBlockResponse.model_validate(block)


@router.delete("/{block_id}", response_model=MessageResponse)
async def delete_block(block_id: int, db: AsyncSession = Depends(get_session))
:
    block = await db.get(ServiceBlock, block_id)
    if not block:
        raise HTTPException(404, "ServiceBlock not found")
    await db.delete(block)
    await db.commit()
    return MessageResponse(message=f"ServiceBlock {block_id} deleted")
