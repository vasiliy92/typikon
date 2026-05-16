"""User schemas — request/response models for authentication."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Login form data."""
    email: str
    password: str


class LoginResponse(BaseModel):
    """Successful login response."""
    user: CurrentUser
    message: str = "Login successful"


class CurrentUser(BaseModel):
    """Current user info (returned by /auth/me)."""
    id: UUID
    email: str
    display_name: str
    role: str
    is_active: bool


class CreateUserRequest(BaseModel):
    """Superadmin creates a new admin user."""
    email: str
    password: str
    display_name: str
    role: str = "admin"


class UpdateUserRequest(BaseModel):
    """Update user (role, active status, display name)."""
    display_name: str | None = None
    role: str | None = None
    is_active: bool | None = None


class ChangePasswordRequest(BaseModel):
    """Change own password."""
    current_password: str
    new_password: str


class UserResponse(BaseModel):
    """Full user info (for admin user management)."""
    id: UUID
    email: str
    display_name: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}