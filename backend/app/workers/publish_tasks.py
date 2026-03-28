from app.workers.celery_app import celery_app


@celery_app.task
def run_publish_task(task_id: str) -> None:
    return None
