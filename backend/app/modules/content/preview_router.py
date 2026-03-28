from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.modules.content.preview_service import PreviewService
from app.models.content import Content
from app.models.content_version import ContentVersion

router = APIRouter()


def get_db():
    from app.core.db import SessionLocal

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _load_content_snapshot(db: Session, content_id: UUID, version_no: int):
    content = db.query(Content).filter(Content.id == content_id).first()
    if content is None:
        raise HTTPException(status_code=404, detail="Content not found")

    version = (
        db.query(ContentVersion)
        .filter(ContentVersion.content_id == content_id, ContentVersion.version_no == version_no)
        .first()
    )
    if version is None:
        raise HTTPException(status_code=404, detail="Content version not found")

    latest_version = (
        db.query(ContentVersion)
        .filter(ContentVersion.content_id == content_id)
        .order_by(ContentVersion.version_no.desc())
        .first()
    )
    if latest_version is None:
        raise HTTPException(status_code=404, detail="Content version not found")

    return content, version, latest_version.version_no


@router.get("/{content_id}/versions/{version_no}/preview")
def preview_content_version(content_id: UUID, version_no: int, channel_type: str, db: Session = Depends(get_db)):
    content, version, _ = _load_content_snapshot(db, content_id, version_no)

    service = PreviewService()
    try:
        bundle = service.build_preview(
            {
                "id": content.id,
                "source_title": content.source_title,
                "source_summary": content.source_summary,
                "source_cta": content.source_cta,
                "keyword_set": content.keyword_set or [],
            },
            {
                "version_no": version.version_no,
                "source_payload": version.source_payload,
            },
            channel_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {
        "content_id": bundle.content_id,
        "version_no": bundle.version_no,
        "channel_type": bundle.channel_type,
        "rendered_preview": bundle.rendered_preview,
        "copy_payload": bundle.copy_payload,
        "validation": bundle.validation,
    }


@router.get("/{content_id}/versions/{version_no}/copy-pack")
def copy_content_version(content_id: UUID, version_no: int, channel_type: str, db: Session = Depends(get_db)):
    content, version, _ = _load_content_snapshot(db, content_id, version_no)

    service = PreviewService()
    try:
        bundle = service.build_copy_pack(
            {
                "id": content.id,
                "source_title": content.source_title,
                "source_summary": content.source_summary,
                "source_cta": content.source_cta,
                "keyword_set": content.keyword_set or [],
            },
            {
                "version_no": version.version_no,
                "source_payload": version.source_payload,
            },
            channel_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {
        "content_id": bundle.content_id,
        "version_no": bundle.version_no,
        "channel_type": bundle.channel_type,
        "copy_payload": bundle.copy_payload,
        "validation": bundle.validation,
    }


@router.get("/{content_id}/versions/{version_no}/approval-pack")
def approval_content_version(content_id: UUID, version_no: int, channel_type: str, db: Session = Depends(get_db)):
    content, version, latest_version_no = _load_content_snapshot(db, content_id, version_no)

    service = PreviewService()
    try:
        bundle = service.build_approval_pack(
            {
                "id": content.id,
                "source_title": content.source_title,
                "source_summary": content.source_summary,
                "source_cta": content.source_cta,
                "keyword_set": content.keyword_set or [],
            },
            {
                "version_no": version.version_no,
                "source_payload": version.source_payload,
            },
            channel_type,
            is_latest_version=(version.version_no == latest_version_no),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {
        "content_id": bundle.content_id,
        "version_no": bundle.version_no,
        "channel_type": bundle.channel_type,
        "approval_state": bundle.approval_state,
        "is_latest_version": bundle.is_latest_version,
        "snapshot_hash": bundle.snapshot_hash,
        "rendered_preview": bundle.rendered_preview,
        "copy_payload": bundle.copy_payload,
        "validation": bundle.validation,
    }
