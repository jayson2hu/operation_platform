import uuid

from sqlalchemy import Column, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.base import Base


class PublishTask(Base):
    __tablename__ = "publish_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    content_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    adaptation_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    channel_account_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    task_type = Column(String(32), nullable=False)
    scheduled_at = Column(DateTime(timezone=True))
    status = Column(String(32), nullable=False, default="pending")
    retry_count = Column(Integer, nullable=False, default=0)
    last_error = Column(String)
    created_by = Column(UUID(as_uuid=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class PublishLog(Base):
    __tablename__ = "publish_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    publish_task_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    attempt_no = Column(Integer, nullable=False)
    request_payload = Column(JSONB, nullable=False, server_default="{}")
    response_payload = Column(JSONB, nullable=False, server_default="{}")
    external_post_id = Column(String(255))
    status = Column(String(32), nullable=False)
    error_message = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
