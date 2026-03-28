from pathlib import Path
import sys
import uuid

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app.modules.publishing.router as publishing_router
from app.main import app
from app.models.publishing import PublishLog, PublishTask

client = TestClient(app)


class PublishQuery:
    def __init__(self, task=None, logs=None):
        self.record = task
        self.logs = logs or []
        self._is_log_query = False
        self._ordered = False

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        self._is_log_query = True
        self._ordered = True
        return self

    def first(self):
        if self._is_log_query:
            if not self.logs:
                return None
            return sorted(self.logs, key=lambda log: log.attempt_no)[-1]
        return self.record

    def all(self):
        return [self.record] if self.record is not None else []


class PublishSession:
    def __init__(self, task=None, logs=None):
        self.task = task
        self.logs = logs or []
        self.added_objects = []

    def query(self, model):
        if model is PublishTask:
            return PublishQuery(task=self.task)
        if model is PublishLog:
            return PublishQuery(logs=self.logs)
        return PublishQuery()

    def add(self, obj):
        if getattr(obj, "id", None) is None:
            obj.id = uuid.uuid4()
        self.added_objects.append(obj)
        if isinstance(obj, PublishTask):
            self.task = obj
        elif isinstance(obj, PublishLog):
            self.logs.append(obj)

    def commit(self):
        return None

    def refresh(self, obj):
        return None

    def close(self):
        return None


def test_create_and_execute_publish_task_success():
    """Test successful automatic publish to channel"""
    task = PublishTask(
        id=uuid.UUID("00000000-0000-0000-0000-000000000500"),
        team_id=uuid.UUID("00000000-0000-0000-0000-000000000501"),
        content_id=uuid.UUID("00000000-0000-0000-0000-000000000502"),
        adaptation_id=uuid.UUID("00000000-0000-0000-0000-000000000503"),
        channel_account_id=uuid.UUID("00000000-0000-0000-0000-000000000504"),
        task_type="auto",
        status="pending",
    )
    fake_session = PublishSession(task)
    app.dependency_overrides[publishing_router.get_db] = lambda: fake_session

    try:
        response = client.post(
            "/publish-tasks",
            json={
                "team_id": str(task.team_id),
                "content_id": str(task.content_id),
                "channel_account_id": str(task.channel_account_id),
                "channel_type": "xiaohongshu",
                "adaptation_payload": {
                    "channel_type": "xiaohongshu",
                    "title": "春季穿搭灵感",
                    "body": "春季穿搭攻略分享",
                    "structured_payload": {
                        "hashtags": ["#春季穿搭"],
                        "cover_media_id": "media-123",
                    },
                },
                "account_context": {
                    "account_id": "xhs-account-123",
                    "publish_mode": "hybrid",
                },
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "succeeded"
        assert body["attempt_no"] == 1
        assert body["external_post_id"] is not None
        assert body["live_url"] is not None
        assert body["error_message"] is None
        # Verify task and log were created
        assert fake_session.task is not None
        assert len(fake_session.logs) == 1
        assert fake_session.logs[0].status == "published"
    finally:
        app.dependency_overrides.clear()


def test_create_and_execute_publish_task_failure():
    """Test failed automatic publish"""
    task = PublishTask(
        id=uuid.UUID("00000000-0000-0000-0000-000000000600"),
        team_id=uuid.UUID("00000000-0000-0000-0000-000000000601"),
        content_id=uuid.UUID("00000000-0000-0000-0000-000000000602"),
        adaptation_id=uuid.UUID("00000000-0000-0000-0000-000000000603"),
        channel_account_id=uuid.UUID("00000000-0000-0000-0000-000000000604"),
        task_type="auto",
        status="pending",
    )
    fake_session = PublishSession(task)
    app.dependency_overrides[publishing_router.get_db] = lambda: fake_session

    try:
        response = client.post(
            "/publish-tasks",
            json={
                "team_id": str(task.team_id),
                "content_id": str(task.content_id),
                "channel_account_id": str(task.channel_account_id),
                "channel_type": "wechat_oa",
                "adaptation_payload": {
                    "channel_type": "wechat_oa",
                    "title": "测试",
                    "body": "<p>测试</p>",
                    "structured_payload": {
                        "digest": "摘要",
                        "cover_media_id": None,
                    },
                },
                "account_context": {
                    # Missing access_token to trigger failure
                },
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "failed"
        assert body["attempt_no"] == 1
        assert body["error_message"] is not None
        # Verify log recorded failure
        assert len(fake_session.logs) == 1
        assert fake_session.logs[0].status == "failed"
    finally:
        app.dependency_overrides.clear()


def test_manual_publish_increments_attempt():
    """Test that manual completion after auto failure increments attempt number"""
    task = PublishTask(
        id=uuid.UUID("00000000-0000-0000-0000-000000000700"),
        team_id=uuid.UUID("00000000-0000-0000-0000-000000000701"),
        content_id=uuid.UUID("00000000-0000-0000-0000-000000000702"),
        adaptation_id=uuid.UUID("00000000-0000-0000-0000-000000000703"),
        channel_account_id=uuid.UUID("00000000-0000-0000-0000-000000000704"),
        task_type="auto",
        status="failed",
    )
    # Simulate a previous failed attempt
    existing_log = PublishLog(
        id=uuid.UUID("00000000-0000-0000-0000-000000000705"),
        publish_task_id=task.id,
        attempt_no=1,
        request_payload={},
        response_payload={},
        status="failed",
        error_message="Missing token",
    )
    fake_session = PublishSession(task, [existing_log])
    app.dependency_overrides[publishing_router.get_db] = lambda: fake_session

    try:
        response = client.post(
            f"/publish-tasks/{task.id}/manual-complete",
            json={
                "status": "published",
                "live_url": "https://xhs.example/post/456",
                "external_post_id": "post-456",
                "operator_name": "ops-retry",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["attempt_no"] == 2
        assert body["task_status"] == "succeeded"
        assert len(fake_session.logs) == 2
        assert fake_session.logs[1].status == "published"
    finally:
        app.dependency_overrides.clear()


def test_publish_task_not_found():
    """Test error when task doesn't exist"""
    fake_session = PublishSession(task=None)
    app.dependency_overrides[publishing_router.get_db] = lambda: fake_session

    try:
        response = client.post(
            f"/publish-tasks/{uuid.uuid4()}/manual-complete",
            json={
                "status": "published",
                "live_url": "https://xhs.example/post/999",
                "external_post_id": "post-999",
                "operator_name": "ops-user",
            },
        )
        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_publish_payload_validation():
    """Test validation of publish payloads"""
    task = PublishTask(
        id=uuid.UUID("00000000-0000-0000-0000-000000000800"),
        team_id=uuid.UUID("00000000-0000-0000-0000-000000000801"),
        content_id=uuid.UUID("00000000-0000-0000-0000-000000000802"),
        adaptation_id=uuid.UUID("00000000-0000-0000-0000-000000000803"),
        channel_account_id=uuid.UUID("00000000-0000-0000-0000-000000000804"),
        task_type="auto",
        status="pending",
    )
    fake_session = PublishSession(task)
    app.dependency_overrides[publishing_router.get_db] = lambda: fake_session

    try:
        # Test with missing required fields
        response = client.post(
            "/publish-tasks",
            json={
                "team_id": str(task.team_id),
                "content_id": str(task.content_id),
                "channel_account_id": str(task.channel_account_id),
                "channel_type": "xiaohongshu",
                "adaptation_payload": {
                    # Missing required fields
                    "title": "",
                    "body": "",
                },
                "account_context": {},
            },
        )
        # Should still succeed (validation in adapter), but log will indicate issues
        assert response.status_code == 201
        body = response.json()
        # The publish might still be attempted, but adapter will handle validation
        assert "publish_task_id" in body
    finally:
        app.dependency_overrides.clear()
