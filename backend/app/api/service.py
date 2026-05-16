"""Service API — liturgical service assembly endpoint."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query

from app.engine.assembler import AssemblyMode, ServiceAssembler
from app.services.db import AsyncSession, get_session

router = APIRouter(prefix="/service", tags=["service"])


@router.get("/assemble")
async def assemble_service(
    target_date: date = Query(..., description="Date for the service (YYYY-MM-DD)"),
    service_type: str = Query(..., description="Service type: liturgy, vespers, matins, vigil, hours"),
    temple_id: int = Query(1, description="Temple ID"),
    language: str = Query("fr", description="Language code"),
    calendar_style: str = Query("new", pattern="^(new|old)$"),
    mode: AssemblyMode = Query(AssemblyMode.FULL),
    db: AsyncSession = Depends(get_session),
):
    """Assemble a complete liturgical service for the given date and temple."""
    assembler = ServiceAssembler(
        db=db,
        target_date=target_date,
        service_type=service_type,
        temple_id=temple_id,
        language=language,
        calendar_style=calendar_style,
        mode=mode,
    )
    return await assembler.assemble()