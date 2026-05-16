"""Authentication service — password hashing, session management, superadmin bootstrap."""
from __future__ import annotations

import json
import secrets
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User, UserRole
from app.services import redis as _redis_mod  # Import MODULE, not variable — avoids stale None reference

# ── Password hashing ──

_pwd_context: Any = None


def _get_pwd_context() -> Any:
    """Lazy-init passlib bcrypt context."""
    global _pwd_context
    if _pwd_context is None:
        from passlib.context import CryptContext
        _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return _pwd_context


def hash_password(password: str) -> str:
    """Hash a plaintext password. Truncates to 72 bytes (bcrypt limit)."""
    raw = password.encode("utf-8")[:72]
    return _get_pwd_context().hash(raw.decode("utf-8", errors="ignore"))


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against its hash. Truncates to 72 bytes."""
    raw = plain.encode("utf-8")[:72]
    return _get_pwd_context().verify(raw.decode("utf-8", errors="ignore"), hashed)


# ── Session management (Redis) ──

SESSION_PREFIX = "session:"
SESSION_TTL = 60 * 60 * 24  # 24 hours


def generate_session_token() -> str:
    """Generate a cryptographically secure session token."""
    return secrets.token_urlsafe(32)


async def create_session(user: User) -> str:
    """Create a Redis session for the given user. Returns the session token."""
    token = generate_session_token()
    data = {
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role,
        "display_name": user.display_name,
    }
    rc = _redis_mod.redis_client  # Read current value from module at call time
    if rc:
        await rc.setex(
            f"{SESSION_PREFIX}{token}",
            SESSION_TTL,
            json.dumps(data),
        )
        print(f"[typikon] Session created: token={token[:8]}... user={user.email}")
    else:
        print(f"[typikon] WARNING: Session NOT stored (Redis unavailable). token={token[:8]}... user={user.email}")
    return token


async def get_session(token: str) -> dict | None:
    """Look up a session by token. Returns session dict or None."""
    rc = _redis_mod.redis_client
    if not rc:
        print(f"[typikon] Session lookup FAILED: Redis unavailable. token={token[:8]}...")
        return None
    raw = await rc.get(f"{SESSION_PREFIX}{token}")
    if raw is None:
        print(f"[typikon] Session NOT FOUND in Redis. token={token[:8]}...")
        return None
    return json.loads(raw)


async def delete_session(token: str) -> None:
    """Delete a session (logout)."""
    rc = _redis_mod.redis_client
    if rc:
        await rc.delete(f"{SESSION_PREFIX}{token}")
        print(f"[typikon] Session deleted: token={token[:8]}...")
    else:
        print(f"[typikon] Session delete skipped (Redis unavailable). token={token[:8]}...")


# ── Superadmin bootstrap ──

async def bootstrap_superadmin(db: AsyncSession) -> None:
    """Create the initial superadmin from env vars if no users exist."""
    result = await db.execute(select(User).limit(1))
    if result.scalar_one_or_none() is not None:
        return  # Users already exist

    email = settings.SUPERADMIN_EMAIL
    password = settings.SUPERADMIN_PASSWORD
    if not email or not password:
        return  # No bootstrap credentials configured

    user = User(
        email=email,
        password_hash=hash_password(password),
        display_name="Superadmin",
        role=UserRole.SUPERADMIN,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    print(f"[typikon] Bootstrapped superadmin: {email}")