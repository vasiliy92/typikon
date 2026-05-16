"""Admin API — aggregated router with authentication."""
from fastapi import APIRouter, Depends

from app.api.admin.blocks import router as blocks_router
from app.api.admin.calendar import router as calendar_router
from app.api.admin.dashboard import router as dashboard_router
from app.api.admin.data_import import router as import_router
from app.api.admin.saints import router as saints_router
from app.api.admin.templates import router as templates_router
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_user)],
)

router.include_router(dashboard_router)
router.include_router(blocks_router)
router.include_router(calendar_router)
router.include_router(saints_router)
router.include_router(templates_router)
router.include_router(import_router)