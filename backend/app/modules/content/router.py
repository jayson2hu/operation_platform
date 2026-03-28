from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.content import (
    ContentCreate,
    ContentRead,
    ContentVersionCreate,
    ContentVersionRead,
    ContentVersionReviseRequest,
)
from app.modules.content.service import ContentRevisionConflict, ContentRevisionError, ContentService

router = APIRouter()


def get_db():
    from app.core.db import SessionLocal

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", response_model=ContentRead, status_code=201)
def create_content(payload: ContentCreate, db: Session = Depends(get_db)):
    service = ContentService(db)
    return service.create_content(payload)


@router.get("", response_model=list[ContentRead])
def list_contents(team_id: UUID | None = None, db: Session = Depends(get_db)):
    service = ContentService(db)
    return service.list_contents(team_id=team_id)


@router.post("/{content_id}/versions", response_model=ContentVersionRead, status_code=201)
def create_content_version(content_id: UUID, payload: ContentVersionCreate, db: Session = Depends(get_db)):
    service = ContentService(db)
    return service.create_version(content_id, payload)


@router.post("/{content_id}/versions/{base_version_no}/revise", response_model=ContentVersionRead, status_code=201)
def revise_content_version(
    content_id: UUID,
    base_version_no: int,
    payload: ContentVersionReviseRequest,
    db: Session = Depends(get_db),
):
    service = ContentService(db)
    try:
        return service.revise_version(content_id, base_version_no, payload)
    except ContentRevisionConflict as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ContentRevisionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{content_id}/versions", response_model=list[ContentVersionRead])
def list_content_versions(content_id: UUID, db: Session = Depends(get_db)):
    service = ContentService(db)
    return service.list_versions(content_id)
