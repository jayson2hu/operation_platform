from app.workers.celery_app import celery_app


@celery_app.task
def sync_post_analytics(platform_post_id: str) -> None:
    return None
