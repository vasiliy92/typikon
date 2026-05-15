"""Admin API — aggregated router."""
from fastapi import APIRouter

from app.api.admin.blocks import router as blocks_router
from app.api.admin.calendar import router as calendar_router
from app.api.admin.import import router as import_router
from app.api.admin.saints import router as saints_router
from app.api.admin.templates import router as templates_router

router = APIRouter(prefix="/admin", tags=["admin"])

router.include_router(blocks_router)
router.include_router(calendar_router)
router.include_router(saints_router)
router.include_router(templates_router)
router.include_router(import_router)
