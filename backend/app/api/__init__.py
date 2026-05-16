"""API — main router combining all sub-routers."""
from fastapi import APIRouter

from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.calendar import router as calendar_router
from app.api.service import router as service_router

router = APIRouter(prefix="/api")

router.include_router(auth_router)
router.include_router(calendar_router)
router.include_router(service_router)
router.include_router(admin_router)
