from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ManualPublishRecordCreate(BaseModel):
    status: Literal["published", "failed"]
    live_url: Optional[str] = None
    external_post_id: Optional[str] = None
    operator_name: Optional[str] = None
    note: Optional[str] = None
    response_payload: dict[str, Any] = Field(default_factory=dict)


class ManualPublishRecordRead(BaseModel):
    publish_log_id: UUID
    publish_task_id: UUID
    attempt_no: int
    status: str
    task_status: str
    live_url: Optional[str] = None
    external_post_id: Optional[str] = None
    operator_name: Optional[str] = None
    note: Optional[str] = None


class PublishTaskCreate(BaseModel):
    team_id: UUID
    content_id: UUID
    channel_account_id: UUID
    channel_type: str
    adaptation_payload: dict[str, Any]
    account_context: dict[str, Any] = Field(default_factory=dict)
    scheduled_at: Optional[str] = None


class PublishTaskRead(BaseModel):
    publish_task_id: UUID
    status: str
    attempt_no: int
    publish_log_id: UUID
    external_post_id: Optional[str] = None
    live_url: Optional[str] = None
    error_message: Optional[str] = None
