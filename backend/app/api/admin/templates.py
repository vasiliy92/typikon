"""Admin API — ServiceTemplate and TemplateBlock CRUD."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.liturgical import ServiceTemplate, ServiceTemplateBlock
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.liturgical import (
    TemplateBlockCreate,
    TemplateBlockResponse,
    TemplateCreate,
    TemplateResponse,
    TemplateUpdate,
)
from app.services.db import get_session

router = APIRouter(prefix="/templates", tags=["admin-templates"])


# --- ServiceTemplate ---


@router.get("", response_model=PaginatedResponse[TemplateResponse])
async def list_templates(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    service_type: str | None = None,
    db: AsyncSession = Depends(get_session),
):
    stmt = select(ServiceTemplate)
    count_stmt = select(func.count(ServiceTemplate.id))

    if service_type:
        stmt = stmt.where(ServiceTemplate.service_type == service_type)
        count_stmt = count_stmt.where(ServiceTemplate.service_type == service_type)

    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.offset((page - 1) * page_size).limit(page_size).order_by(ServiceTemplate.id)
    items = list((await db.execute(stmt)).scalars().all())

    return PaginatedResponse(
        items=[TemplateResponse.model_validate(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: int, db: AsyncSession = Depends(get_session)):
    template = await db.get(ServiceTemplate, template_id)
    if not template:
        raise HTTPException(404, "Template not found")
    return TemplateResponse.model_validate(template)


@router.post("", response_model=TemplateResponse, status_code=201)
async def create_template(
    data: TemplateCreate,
    db: AsyncSession = Depends(get_session),
):
    template = ServiceTemplate(**data.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return TemplateResponse.model_validate(template)


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    data: TemplateUpdate,
    db: AsyncSession = Depends(get_session),
):
    template = await db.get(ServiceTemplate, template_id)
    if not template:
        raise HTTPException(404, "Template not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(template, key, value)
    await db.commit()
    await db.refresh(template)
    return TemplateResponse.model_validate(template)


@router.delete("/{template_id}", response_model=MessageResponse)
async def delete_template(template_id: int, db: AsyncSession = Depends(get_session)):
    template = await db.get(ServiceTemplate, template_id)
    if not template:
        raise HTTPException(404, "Template not found")
    await db.delete(template)
    await db.commit()
    return MessageResponse(message=f"Template {template_id} deleted")


# --- TemplateBlock ---


@router.get(
    "/{template_id}/blocks",
    response_model=PaginatedResponse[TemplateBlockResponse],
)
async def list_template_blocks(
    template_id: int,
    db: AsyncSession = Depends(get_session),
):
    template = await db.get(ServiceTemplate, template_id)
    if not template:
        raise HTTPException(404, "Template not found")

    stmt = (
        select(ServiceTemplateBlock)
        .where(ServiceTemplateBlock.template_id == template_id)
        .order_by(ServiceTemplateBlock.sort_order)
    )
    items = list((await db.execute(stmt)).scalars().all())
    return PaginatedResponse(
        items=[TemplateBlockResponse.model_validate(b) for b in items],
        total=len(items),
        page=1,
        page_size=len(items),
    )


@router.post(
    "/{template_id}/blocks",
    response_model=TemplateBlockResponse,
    status_code=201,
)
async def add_template_block(
    template_id: int,
    data: TemplateBlockCreate,
    db: AsyncSession = Depends(get_session),
):
    template = await db.get(ServiceTemplate, template_id)
    if not template:
        raise HTTPException(404, "Template not found")

    block = ServiceTemplateBlock(template_id=template_id, **data.model_dump())
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return TemplateBlockResponse.model_validate(block)


@router.delete(
    "/{template_id}/blocks/{block_id}",
    response_model=MessageResponse,
)
async def delete_template_block(
    template_id: int,
    block_id: int,
    db: AsyncSession = Depends(get_session),
):
    block = await db.get(ServiceTemplateBlock, block_id)
    if not block or block.template_id != template_id:
        raise HTTPException(404, "TemplateBlock not found")
    await db.delete(block)
    await db.commit()
    return MessageResponse(message=f"TemplateBlock {block_id} deleted")
