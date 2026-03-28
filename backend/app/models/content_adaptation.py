import uuid

from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.base import Base


class ContentAdaptation(Base):
    __tablename__ = "content_adaptations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    version_no = Column(String(32), nullable=False)
    channel_type = Column(String(32), nullable=False, index=True)
    adaptation_payload = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        # Composite unique constraint: only one adaptation per version+channel
        # Allow tracking of generated adaptations
    )
