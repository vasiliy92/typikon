"""Auth API — login, logout, session management, user CRUD."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_superadmin
from app.models.user import User, UserRole
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.user import (
    ChangePasswordRequest,
    CreateUserRequest,
    CurrentUser,
    LoginRequest,
    LoginResponse,
    UpdateUserRequest,
    UserResponse,
)
from app.services.auth import (
    create_session,
    delete_session,
    hash_password,
    verify_password,
)
from app.services.db import get_session

router = APIRouter(prefix="/auth", tags=["auth"])

# Cookie settings
_COOKIE_NAME = "session_token"
_COOKIE_MAX_AGE = 60 * 60 * 24  # 24 hours
_COOKIE_PATH = "/"


def _set_session_cookie(response: Response, token: str) -> None:
    """Set httpOnly session cookie."""
    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        max_age=_COOKIE_MAX_AGE,
        path=_COOKIE_PATH,
        httponly=True,
        samesite="lax",
        secure=False,  # Set True in production behind HTTPS proxy
    )


def _clear_session_cookie(response: Response) -> None:
    """Clear session cookie."""
    response.delete_cookie(key=_COOKIE_NAME, path=_COOKIE_PATH)


@router.post("/login", response_model=LoginResponse)
async def login(
    data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_session),
):
    """Authenticate with email and password. Sets httpOnly session cookie."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.is_active or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    token = await create_session(user)
    _set_session_cookie(response, token)

    return LoginResponse(
        user=CurrentUser(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            role=user.role,
            is_active=user.is_active,
        ),
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    user: User = Depends(get_current_user),
):
    """Clear session and cookie."""
    _clear_session_cookie(response)
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=CurrentUser)
async def get_me(user: User = Depends(get_current_user)):
    """Return current authenticated user info."""
    return CurrentUser(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        is_active=user.is_active,
    )


@router.put("/password", response_model=MessageResponse)
async def change_password(
    data: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Change own password."""
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    user.password_hash = hash_password(data.new_password)
    await db.commit()
    return MessageResponse(message="Password changed")


# ── User management (superadmin only) ──

@router.get("/users", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = 1,
    page_size: int = 50,
    _superadmin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_session),
):
    """List all admin users (superadmin only)."""
    total = (await db.execute(select(func.count(User.id)))).scalar() or 0
    stmt = (
        select(User)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .order_by(User.created_at)
    )
    items = list((await db.execute(stmt)).scalars().all())
    return PaginatedResponse(
        items=[UserResponse.model_validate(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    data: CreateUserRequest,
    _superadmin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_session),
):
    """Create a new admin user (superadmin only)."""
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    if data.role not in (UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(400, "Invalid role. Must be 'admin' or 'superadmin'")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
        role=data.role,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    data: UpdateUserRequest,
    _superadmin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_session),
):
    """Update a user's role, active status, or display name (superadmin only)."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    if data.display_name is not None:
        user.display_name = data.display_name
    if data.role is not None:
        if data.role not in (UserRole.ADMIN, UserRole.SUPERADMIN):
            raise HTTPException(400, "Invalid role")
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active

    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: UUID,
    _superadmin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_session),
):
    """Delete a user (superadmin only). Cannot delete self."""
    if str(user_id) == str(_superadmin.id):
        raise HTTPException(400, "Cannot delete your own account")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    await db.delete(user)
    await db.commit()
    return MessageResponse(message=f"User {user.email} deleted")