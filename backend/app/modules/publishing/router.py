from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.publishing import (
    ManualPublishRecordCreate,
    ManualPublishRecordRead,
    PublishTaskCreate,
    PublishTaskRead,
)
from app.modules.publishing.service import (
    PublishRecordError,
    PublishTaskNotFound,
    PublishingService,
)

router = APIRouter()


def get_db():
    from app.core.db import SessionLocal

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", response_model=PublishTaskRead, status_code=201)
def create_and_execute_publish(payload: PublishTaskCreate, db: Session = Depends(get_db)):
    """
    Create and immediately execute a publish task.
    Supports automatic publishing to channels.
    """
    service = PublishingService(db)
    try:
        # Create the publish task
        task = service.create_publish_task(
            team_id=payload.team_id,
            content_id=payload.content_id,
            adaptation_id=payload.channel_account_id,  # Using as temporary ID
            channel_account_id=payload.channel_account_id,
            task_type="auto",
        )

        # Execute the publish
        task, log = service.execute_publish(
            task_id=task.id,
            adaptation_payload=payload.adaptation_payload,
            channel_type=payload.channel_type,
            account_context=payload.account_context,
        )
    except PublishTaskNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PublishRecordError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {
        "publish_task_id": task.id,
        "status": task.status,
        "attempt_no": log.attempt_no,
        "publish_log_id": log.id,
        "external_post_id": log.external_post_id,
        "live_url": log.response_payload.get("live_url"),
        "error_message": log.error_message,
    }


@router.post("/{task_id}/manual-complete", response_model=ManualPublishRecordRead, status_code=201)
def manual_complete_publish(task_id: UUID, payload: ManualPublishRecordCreate, db: Session = Depends(get_db)):
    service = PublishingService(db)
    try:
        task, log = service.record_manual_completion(task_id, payload)
    except PublishTaskNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PublishRecordError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {
        "publish_log_id": log.id,
        "publish_task_id": task.id,
        "attempt_no": log.attempt_no,
        "status": log.status,
        "task_status": task.status,
        "live_url": log.response_payload.get("live_url"),
        "external_post_id": log.external_post_id,
        "operator_name": log.response_payload.get("operator_name"),
        "note": log.error_message,
    }
