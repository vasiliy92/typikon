"""FastAPI dependencies — authentication and authorization."""
from __future__ import annotations

from uuid import UUID

from fastapi import Cookie, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.services.auth import get_session as get_auth_session
from app.services.db import get_session


async def _get_token_from_request(
    request: Request,
    session_token: str | None = Cookie(default=None),
) -> str | None:
    """Extract session token from cookie or Authorization header."""
    # 1. Cookie
    if session_token:
        return session_token
    # 2. Authorization: Bearer <token>
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return None


async def get_current_user(
    request: Request,
    session_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_session),
) -> User:
    """Dependency: returns the authenticated User or raises 401.

    Supports:
    - Session cookie (web UI)
    - Bearer token (API)
    - X-Admin-Key header (legacy API key)
    """
    # Legacy API key support
    api_key = request.headers.get("x-admin-key")
    if api_key and api_key == request.app.state.settings.ADMIN_API_KEY:
        # API key grants superadmin-like access; return a synthetic user
        return User(
            email="api-key",
            password_hash="",
            display_name="API Key",
            role=UserRole.SUPERADMIN,
            is_active=True,
        )

    # Session-based auth
    token = await _get_token_from_request(request, session_token)
    if not token:
        raise HTTPException(401, "Not authenticated")

    session_data = await get_auth_session(token)
    if not session_data:
        raise HTTPException(401, "Session expired or invalid")

    user_id = session_data.get("user_id")
    if not user_id:
        raise HTTPException(401, "Invalid session")

    user = await db.get(User, UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(401, "User not found or inactive")

    return user


async def require_superadmin(
    user: User = Depends(get_current_user),
) -> User:
    """Dependency: requires the current user to be a superadmin."""
    if user.role != UserRole.SUPERADMIN:
        raise HTTPException(403, "Superadmin access required")
    return user