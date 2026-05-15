"""Common Pydantic schemas — pagination, API responses."""
from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar, Optional

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = 1
    size: int = 50


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def create(cls, items: list[T], total: int, page: int, size: int) -> "PaginatedResponse[T]":
        return cls(items=items, total=total, page=page, size=size, pages=(total + size - 1) // size)


class MessageResponse(BaseModel):
    status: str
    message: Optional[str] = None
    id: Optional[int] = None


class ErrorResponse(BaseModel):
    detail: str
