from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ContentCreate(BaseModel):
    team_id: UUID
    objective: Optional[str] = None
    audience: Optional[str] = None
    campaign_name: Optional[str] = None
    source_title: str
    source_summary: Optional[str] = None
    source_cta: Optional[str] = None
    keyword_set: list[str] = Field(default_factory=list)
    created_by: Optional[UUID] = None


class ContentRead(BaseModel):
    id: UUID
    team_id: UUID
    status: str
    objective: Optional[str] = None
    audience: Optional[str] = None
    campaign_name: Optional[str] = None
    source_title: str
    source_summary: Optional[str] = None
    source_cta: Optional[str] = None
    keyword_set: list[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ContentVersionCreate(BaseModel):
    created_by: Optional[UUID] = None
    source_payload: dict[str, Any]


class ContentVersionReviseRequest(BaseModel):
    created_by: Optional[UUID] = None
    source_title: Optional[str] = None
    source_summary: Optional[str] = None
    source_cta: Optional[str] = None
    keyword_set: Optional[list[str]] = None
    source_payload_patch: dict[str, Any] = Field(default_factory=dict)


class ContentVersionRead(BaseModel):
    id: UUID
    content_id: UUID
    version_no: int
    source_payload: dict[str, Any]
    created_by: Optional[UUID] = None

    class Config:
        from_attributes = True
