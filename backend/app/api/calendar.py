"""Calendar API — liturgical date computation endpoints."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Query

from app.engine.calendar import (
    compute_liturgical_date,
    compute_pascha,
    gregorian_to_julian,
    julian_to_gregorian,
)

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/today")
async def liturgical_today(
    style: str = Query("new", pattern="^(new|old)$", alias="style"),
    calendar_style: str = Query(None, deprecated=True, description="Use 'style' instead"),
):
    """Get liturgical information for today."""
    cal_style = calendar_style if calendar_style else style
    return compute_liturgical_date(date.today(), cal_style)


@router.get("/date/{target_date}")
async def liturgical_date(
    target_date: date,
    style: str = Query("new", pattern="^(new|old)$", alias="style"),
    calendar_style: str = Query(None, deprecated=True, description="Use 'style' instead"),
):
    """Get liturgical information for a specific date (YYYY-MM-DD)."""
    # Support both 'style' and deprecated 'calendar_style' params
    cal_style = calendar_style if calendar_style else style
    return compute_liturgical_date(target_date, cal_style)


@router.get("/pascha/{year}")
async def pascha_for_year(year: int):
    """Compute Orthodox Pascha date for a given year."""
    pascha_julian = compute_pascha(year)
    pascha_gregorian = julian_to_gregorian(pascha_julian)
    return {
        "year": year,
        "pascha_julian": pascha_julian.isoformat(),
        "pascha_gregorian": pascha_gregorian.isoformat(),
    }


@router.get("/convert")
async def convert_date(
    d: date = Query(..., description="Date to convert"),
    direction: str = Query("to_julian", pattern="^(to_julian|to_gregorian)$"),
):
    """Convert between Julian and Gregorian calendars."""
    if direction == "to_julian":
        result = gregorian_to_julian(d)
        return {"gregorian": d.isoformat(), "julian": result.isoformat()}
    else:
        result = julian_to_gregorian(d)
        return {"julian": d.isoformat(), "gregorian": result.isoformat()}


@router.get("/kathismata/{target_date}")
async def kathismata(
    target_date: date,
    service_type: str = Query("matins", pattern="^(vespers|matins)$"),
    calendar_style: str = Query("new", pattern="^(new|old)$"),
):
    """Get kathismata schedule for a given date and service."""
    info = compute_liturgical_date(target_date, calendar_style)
    return {
        "date": target_date.isoformat(),
        "service_type": service_type,
        "kathismata": info.get("kathismata", {}).get(service_type, []),
        "period": info.get("period"),
        "tone": info.get("tone"),
    }
