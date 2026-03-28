from uuid import uuid4
from sqlalchemy.orm import Session

from app.models.publishing import PublishLog, PublishTask
from app.models.content_adaptation import ContentAdaptation
from app.schemas.publishing import ManualPublishRecordCreate
from app.modules.channel_adapters.factory import get_adapter


class PublishRecordError(Exception):
    pass


class PublishTaskNotFound(PublishRecordError):
    pass


class PublishRecordValidationError(PublishRecordError):
    pass


class PublishingService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.max_retries = 3

    def create_publish_task(self, team_id, content_id, adaptation_id, channel_account_id, task_type="auto"):
        """Create a new publish task."""
        task = PublishTask(
            id=uuid4(),
            team_id=team_id,
            content_id=content_id,
            adaptation_id=adaptation_id,
            channel_account_id=channel_account_id,
            task_type=task_type,
            status="pending",
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def record_manual_completion(self, task_id, payload: ManualPublishRecordCreate):
        task = self.db.query(PublishTask).filter(PublishTask.id == task_id).first()
        if task is None:
            raise PublishTaskNotFound("Publish task not found")

        if payload.status == "published" and not payload.live_url:
            raise PublishRecordValidationError("live_url is required when status is published")
        if payload.status == "failed" and not payload.note:
            raise PublishRecordValidationError("note is required when status is failed")

        latest_log = (
            self.db.query(PublishLog)
            .filter(PublishLog.publish_task_id == task_id)
            .order_by(PublishLog.attempt_no.desc())
            .first()
        )
        attempt_no = 1 if latest_log is None else latest_log.attempt_no + 1

        response_payload = dict(payload.response_payload or {})
        if payload.live_url is not None:
            response_payload.setdefault("live_url", payload.live_url)
        if payload.external_post_id is not None:
            response_payload.setdefault("external_post_id", payload.external_post_id)
        if payload.operator_name is not None:
            response_payload.setdefault("operator_name", payload.operator_name)

        log = PublishLog(
            publish_task_id=task_id,
            attempt_no=attempt_no,
            request_payload=payload.model_dump(),
            response_payload=response_payload,
            external_post_id=payload.external_post_id,
            status=payload.status,
            error_message=payload.note if payload.status == "failed" else None,
        )

        task.status = "succeeded" if payload.status == "published" else "failed"
        task.last_error = payload.note if payload.status == "failed" else None

        self.db.add(log)
        self.db.commit()
        self.db.refresh(task)
        self.db.refresh(log)
        return task, log

    def execute_publish(self, task_id, adaptation_payload: dict, channel_type: str, account_context: dict):
        """
        Execute automatic publishing for a task.
        Records attempt in PublishLog and updates PublishTask status.
        """
        task = self.db.query(PublishTask).filter(PublishTask.id == task_id).first()
        if task is None:
            raise PublishTaskNotFound("Publish task not found")

        if task.status not in ("pending", "failed"):
            raise PublishRecordValidationError(f"Cannot publish task with status {task.status}")

        # Get latest attempt number
        latest_log = (
            self.db.query(PublishLog)
            .filter(PublishLog.publish_task_id == task_id)
            .order_by(PublishLog.attempt_no.desc())
            .first()
        )
        attempt_no = 1 if latest_log is None else latest_log.attempt_no + 1

        # Check retry limit
        if attempt_no > self.max_retries:
            raise PublishRecordValidationError(f"Max retries ({self.max_retries}) exceeded")

        # Update task status to publishing
        task.status = "publishing"
        self.db.commit()

        # Get adapter and build publish payload
        adapter = get_adapter(channel_type)
        try:
            # Prepare media variants (empty for MVP)
            media_variants = []

            # Build publish payload
            publish_payload = adapter.build_publish_payload(
                adaptation_payload,
                media_variants,
                account_context,
            )

            # Execute publish via adapter
            publish_response = adapter.publish(publish_payload, account_context)

            # Record the attempt
            if publish_response.get("status") == "success":
                log_status = "published"
                external_post_id = publish_response.get("external_post_id")
                task.status = "succeeded"
                error_message = None
            else:
                log_status = "failed"
                external_post_id = None
                task.status = "failed"
                task.retry_count = attempt_no
                error_message = publish_response.get("error_message", "Unknown error")

            # Create and save log
            log = PublishLog(
                publish_task_id=task_id,
                attempt_no=attempt_no,
                request_payload={"publish_payload": publish_payload},
                response_payload={
                    "external_post_id": external_post_id,
                    "live_url": publish_response.get("live_url"),
                },
                external_post_id=external_post_id,
                status=log_status,
                error_message=error_message,
            )

            task.last_error = error_message

            self.db.add(log)
            self.db.commit()
            self.db.refresh(task)
            self.db.refresh(log)

            return task, log

        except Exception as e:
            # Handle unexpected errors
            task.status = "failed"
            task.retry_count = attempt_no
            task.last_error = str(e)

            log = PublishLog(
                publish_task_id=task_id,
                attempt_no=attempt_no,
                request_payload={"adaptation_payload": adaptation_payload},
                response_payload={},
                external_post_id=None,
                status="failed",
                error_message=f"Exception: {str(e)}",
            )

            self.db.add(log)
            self.db.commit()
            self.db.refresh(task)
            self.db.refresh(log)

            return task, log
