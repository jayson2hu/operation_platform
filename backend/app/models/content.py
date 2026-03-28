import uuid

from sqlalchemy import Column, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.base import Base


class Content(Base):
    __tablename__ = "contents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    status = Column(String(32), nullable=False, default="draft")
    objective = Column(String(120))
    audience = Column(String(120))
    campaign_name = Column(String(120))
    source_title = Column(String(255), nullable=False)
    source_summary = Column(Text)
    source_cta = Column(Text)
    keyword_set = Column(JSONB, nullable=False, server_default="[]")
    created_by = Column(UUID(as_uuid=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
