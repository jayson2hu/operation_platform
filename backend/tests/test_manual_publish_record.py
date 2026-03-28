from pathlib import Path
import sys
import uuid

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app.modules.content.router as content_router
import app.modules.content.preview_router as preview_router
import app.modules.publishing.router as publishing_router
from app.main import app
from app.models.content import Content
from app.models.content_version import ContentVersion
from app.models.publishing import PublishLog, PublishTask
from app.modules.content.preview_service import PreviewService

client = TestClient(app)


class FakeQuery:
    def __init__(self, record):
        self.record = record
        self._ordered = False

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        self._ordered = True
        return self

    def first(self):
        return self.record

    def all(self):
        return [self.record] if self.record is not None else []


class FakeSession:
    def __init__(self, content, version):
        self.content = content
        self.version = version

    def query(self, model):
        if model is Content:
            return FakeQuery(self.content)
        if model is ContentVersion:
            return FakeQuery(self.version)
        return FakeQuery(None)

    def close(self):
        return None


class RevisionQuery(FakeQuery):
    def __init__(self, record, all_records=None):
        super().__init__(record)
        self.all_records = all_records or []

    def all(self):
        return self.all_records


class RevisionSession(FakeSession):
    def add(self, obj):
        if getattr(obj, "id", None) is None:
            obj.id = uuid.uuid4()
        self.added = obj

    def commit(self):
        return None

    def refresh(self, obj):
        return None

    def query(self, model):
        if model is Content:
            return RevisionQuery(self.content)
        if model is ContentVersion:
            return RevisionQuery(self.version, [self.version])
        return RevisionQuery(None)


class ApprovalQuery(FakeQuery):
    def __init__(self, current_record, latest_record=None):
        super().__init__(current_record)
        self.latest_record = latest_record or current_record

    def order_by(self, *args, **kwargs):
        self._ordered = True
        return self

    def first(self):
        return self.latest_record if self._ordered else self.record


class ApprovalSession(FakeSession):
    def __init__(self, content, version, latest_version):
        super().__init__(content, version)
        self.latest_version = latest_version

    def query(self, model):
        if model is Content:
            return ApprovalQuery(self.content)
        if model is ContentVersion:
            return ApprovalQuery(self.version, self.latest_version)
        return ApprovalQuery(None)


class PublishQuery(FakeQuery):
    def __init__(self, task=None, logs=None):
        super().__init__(task)
        self.logs = logs or []
        self._is_log_query = False

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        self._is_log_query = True
        return self

    def first(self):
        if self._is_log_query:
            if not self.logs:
                return None
            return sorted(self.logs, key=lambda log: log.attempt_no)[-1]
        return self.record


class PublishSession:
    def __init__(self, task, logs=None):
        self.task = task
        self.logs = logs or []

    def query(self, model):
        if model is PublishTask:
            return PublishQuery(task=self.task)
        if model is PublishLog:
            return PublishQuery(logs=self.logs)
        return PublishQuery()

    def add(self, obj):
        if getattr(obj, "id", None) is None:
            obj.id = uuid.uuid4()
        self.logs.append(obj)
        self.added = obj

    def commit(self):
        return None

    def refresh(self, obj):
        return None

    def close(self):
        return None


def test_preview_pack_for_xiaohongshu_and_wechat():
    service = PreviewService()
    content = {
        "id": "00000000-0000-0000-0000-000000000001",
        "source_title": "春季通勤穿搭灵感",
        "source_summary": "整理适合通勤的春季搭配方案",
        "source_cta": "收藏后慢慢看",
        "keyword_set": ["春季穿搭", "通勤"],
    }
    version = {"version_no": 1, "source_payload": {"source_title": "版本标题", "blocks": []}}

    xhs = service.build_preview(content, version, "xiaohongshu")
    assert xhs.content_id == content["id"]
    assert xhs.version_no == 1
    assert xhs.channel_type == "xiaohongshu"
    assert xhs.copy_payload["title"] == "版本标题"
    assert "copy_text" in xhs.copy_payload
    assert xhs.validation["status"] in {"warning", "blocked", "valid"}

    wechat = service.build_preview(content, version, "wechat_oa")
    assert wechat.content_id == content["id"]
    assert wechat.version_no == 1
    assert wechat.channel_type == "wechat_oa"
    assert wechat.copy_payload["title"] == "版本标题"
    assert "html" in wechat.copy_payload
    assert wechat.validation["status"] in {"warning", "blocked", "valid"}


def test_preview_endpoint_returns_bundle():
    content = Content(
        id="00000000-0000-0000-0000-000000000001",
        team_id="00000000-0000-0000-0000-000000000002",
        source_title="春季通勤穿搭灵感",
        source_summary="整理适合通勤的春季搭配方案",
        source_cta="收藏后慢慢看",
        keyword_set=["春季穿搭", "通勤"],
    )
    version = ContentVersion(
        id="00000000-0000-0000-0000-000000000003",
        content_id=content.id,
        version_no=1,
        source_payload={"source_title": "版本标题"},
    )

    fake_session = FakeSession(content, version)
    app.dependency_overrides[preview_router.get_db] = lambda: fake_session
    try:
        response = client.get(f"/contents/{content.id}/versions/1/preview", params={"channel_type": "xiaohongshu"})
        assert response.status_code == 200
        body = response.json()
        assert body["content_id"] == str(content.id)
        assert body["version_no"] == 1
        assert body["channel_type"] == "xiaohongshu"
        assert "copy_payload" in body
        assert "rendered_preview" in body
        assert "validation" in body
    finally:
        app.dependency_overrides.clear()


def test_copy_pack_endpoint_returns_bundle():
    content = Content(
        id="00000000-0000-0000-0000-000000000020",
        team_id="00000000-0000-0000-0000-000000000021",
        source_title="春季通勤穿搭灵感",
        source_summary="整理适合通勤的春季搭配方案",
        source_cta="收藏后慢慢看",
        keyword_set=["春季穿搭", "通勤"],
    )
    version = ContentVersion(
        id="00000000-0000-0000-0000-000000000022",
        content_id=content.id,
        version_no=1,
        source_payload={"source_title": "版本标题"},
    )

    fake_session = FakeSession(content, version)
    app.dependency_overrides[preview_router.get_db] = lambda: fake_session
    try:
        response = client.get(f"/contents/{content.id}/versions/1/copy-pack", params={"channel_type": "xiaohongshu"})
        assert response.status_code == 200
        body = response.json()
        assert body["content_id"] == str(content.id)
        assert body["version_no"] == 1
        assert body["channel_type"] == "xiaohongshu"
        assert body["copy_payload"]["copy_text"]
        assert "validation" in body
        assert "rendered_preview" not in body
    finally:
        app.dependency_overrides.clear()


def test_copy_pack_endpoint_rejects_unsupported_channel():
    content = Content(
        id="00000000-0000-0000-0000-000000000023",
        team_id="00000000-0000-0000-0000-000000000024",
        source_title="春季通勤穿搭灵感",
        source_summary="整理适合通勤的春季搭配方案",
        source_cta="收藏后慢慢看",
        keyword_set=["春季穿搭", "通勤"],
    )
    version = ContentVersion(
        id="00000000-0000-0000-0000-000000000025",
        content_id=content.id,
        version_no=1,
        source_payload={"source_title": "版本标题"},
    )

    fake_session = FakeSession(content, version)
    app.dependency_overrides[preview_router.get_db] = lambda: fake_session
    try:
        response = client.get(f"/contents/{content.id}/versions/1/copy-pack", params={"channel_type": "unsupported"})
        assert response.status_code == 400
    finally:
        app.dependency_overrides.clear()


def test_approval_pack_endpoint_returns_snapshot():
    content = Content(
        id="00000000-0000-0000-0000-000000000030",
        team_id="00000000-0000-0000-0000-000000000031",
        source_title="春季通勤穿搭灵感",
        source_summary="整理适合通勤的春季搭配方案",
        source_cta="收藏后慢慢看",
        keyword_set=["春季穿搭", "通勤"],
    )
    version = ContentVersion(
        id="00000000-0000-0000-0000-000000000032",
        content_id=content.id,
        version_no=1,
        source_payload={"source_title": "版本标题"},
    )
    latest_version = ContentVersion(
        id="00000000-0000-0000-0000-000000000033",
        content_id=content.id,
        version_no=1,
        source_payload={"source_title": "版本标题"},
    )

    fake_session = ApprovalSession(content, version, latest_version)
    app.dependency_overrides[preview_router.get_db] = lambda: fake_session
    try:
        response = client.get(f"/contents/{content.id}/versions/1/approval-pack", params={"channel_type": "wechat_oa"})
        assert response.status_code == 200
        body = response.json()
        assert body["content_id"] == str(content.id)
        assert body["version_no"] == 1
        assert body["channel_type"] == "wechat_oa"
        assert body["is_latest_version"] is True
        assert body["approval_state"] in {"ready", "needs_review", "blocked", "stale"}
        assert body["snapshot_hash"]
        assert "rendered_preview" in body
        assert "copy_payload" in body
    finally:
        app.dependency_overrides.clear()


def test_approval_pack_endpoint_marks_stale_snapshot():
    content = Content(
        id="00000000-0000-0000-0000-000000000034",
        team_id="00000000-0000-0000-0000-000000000035",
        source_title="春季通勤穿搭灵感",
        source_summary="整理适合通勤的春季搭配方案",
        source_cta="收藏后慢慢看",
        keyword_set=["春季穿搭", "通勤"],
    )
    version = ContentVersion(
        id="00000000-0000-0000-0000-000000000036",
        content_id=content.id,
        version_no=1,
        source_payload={"source_title": "版本标题"},
    )
    latest_version = ContentVersion(
        id="00000000-0000-0000-0000-000000000037",
        content_id=content.id,
        version_no=2,
        source_payload={"source_title": "版本标题2"},
    )

    fake_session = ApprovalSession(content, version, latest_version)
    app.dependency_overrides[preview_router.get_db] = lambda: fake_session
    try:
        response = client.get(f"/contents/{content.id}/versions/1/approval-pack", params={"channel_type": "xiaohongshu"})
        assert response.status_code == 200
        body = response.json()
        assert body["is_latest_version"] is False
        assert body["approval_state"] == "stale"
    finally:
        app.dependency_overrides.clear()


def test_preview_endpoint_rejects_unsupported_channel():
    content = Content(
        id="00000000-0000-0000-0000-000000000004",
        team_id="00000000-0000-0000-0000-000000000005",
        source_title="春季通勤穿搭灵感",
        source_summary="整理适合通勤的春季搭配方案",
        source_cta="收藏后慢慢看",
        keyword_set=["春季穿搭", "通勤"],
    )
    version = ContentVersion(
        id="00000000-0000-0000-0000-000000000006",
        content_id=content.id,
        version_no=1,
        source_payload={"source_title": "版本标题"},
    )

    fake_session = FakeSession(content, version)
    app.dependency_overrides[preview_router.get_db] = lambda: fake_session
    try:
        response = client.get(f"/contents/{content.id}/versions/1/preview", params={"channel_type": "unsupported"})
        assert response.status_code == 400
    finally:
        app.dependency_overrides.clear()


def test_revision_flow_creates_new_version():
    content = Content(
        id="00000000-0000-0000-0000-000000000010",
        team_id="00000000-0000-0000-0000-000000000011",
        source_title="原始标题",
        source_summary="原始摘要",
        source_cta="原始CTA",
        keyword_set=["原始"],
    )
    base_version = ContentVersion(
        id="00000000-0000-0000-0000-000000000012",
        content_id=content.id,
        version_no=1,
        source_payload={"source_title": "原始标题", "sections": [{"id": "s1", "text": "旧内容"}]},
    )

    fake_session = RevisionSession(content, base_version)
    app.dependency_overrides[content_router.get_db] = lambda: fake_session
    try:
        response = client.post(
            f"/contents/{content.id}/versions/1/revise",
            json={
                "source_summary": "更新后的摘要",
                "source_payload_patch": {
                    "sections": [{"id": "s1", "text": "新内容"}]
                },
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["version_no"] == 2
        assert body["content_id"] == str(content.id)
    finally:
        app.dependency_overrides.clear()


def test_manual_publish_record_creates_log_and_updates_task():
    task = PublishTask(
        id=uuid.UUID("00000000-0000-0000-0000-000000000100"),
        team_id=uuid.UUID("00000000-0000-0000-0000-000000000101"),
        content_id=uuid.UUID("00000000-0000-0000-0000-000000000102"),
        adaptation_id=uuid.UUID("00000000-0000-0000-0000-000000000103"),
        channel_account_id=uuid.UUID("00000000-0000-0000-0000-000000000104"),
        task_type="publish_now",
        status="manual_action_required",
    )
    fake_session = PublishSession(task)
    app.dependency_overrides[publishing_router.get_db] = lambda: fake_session
    try:
        response = client.post(
            f"/publish-tasks/{task.id}/manual-complete",
            json={
                "status": "published",
                "live_url": "https://xhs.example/post/123",
                "external_post_id": "post-123",
                "operator_name": "ops-user",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["publish_task_id"] == str(task.id)
        assert body["attempt_no"] == 1
        assert body["task_status"] == "succeeded"
        assert body["live_url"] == "https://xhs.example/post/123"
        assert body["external_post_id"] == "post-123"
        assert body["operator_name"] == "ops-user"
        assert body["note"] is None
        assert fake_session.task.status == "succeeded"
        assert len(fake_session.logs) == 1
    finally:
        app.dependency_overrides.clear()


def test_manual_publish_record_increments_attempt_number():
    task = PublishTask(
        id=uuid.UUID("00000000-0000-0000-0000-000000000200"),
        team_id=uuid.UUID("00000000-0000-0000-0000-000000000201"),
        content_id=uuid.UUID("00000000-0000-0000-0000-000000000202"),
        adaptation_id=uuid.UUID("00000000-0000-0000-0000-000000000203"),
        channel_account_id=uuid.UUID("00000000-0000-0000-0000-000000000204"),
        task_type="publish_now",
        status="manual_action_required",
    )
    existing_log = PublishLog(
        id=uuid.UUID("00000000-0000-0000-0000-000000000205"),
        publish_task_id=task.id,
        attempt_no=1,
        request_payload={"status": "failed"},
        response_payload={},
        status="failed",
    )
    fake_session = PublishSession(task, [existing_log])
    app.dependency_overrides[publishing_router.get_db] = lambda: fake_session
    try:
        response = client.post(
            f"/publish-tasks/{task.id}/manual-complete",
            json={
                "status": "failed",
                "note": "平台审核中",
                "operator_name": "ops-user",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["attempt_no"] == 2
        assert body["task_status"] == "failed"
        assert body["note"] == "平台审核中"
        assert len(fake_session.logs) == 2
    finally:
        app.dependency_overrides.clear()


def test_manual_publish_record_rejects_missing_task():
    task = PublishTask(
        id=uuid.UUID("00000000-0000-0000-0000-000000000300"),
        team_id=uuid.UUID("00000000-0000-0000-0000-000000000301"),
        content_id=uuid.UUID("00000000-0000-0000-0000-000000000302"),
        adaptation_id=uuid.UUID("00000000-0000-0000-0000-000000000303"),
        channel_account_id=uuid.UUID("00000000-0000-0000-0000-000000000304"),
        task_type="publish_now",
        status="manual_action_required",
    )
    fake_session = PublishSession(task=None)
    app.dependency_overrides[publishing_router.get_db] = lambda: fake_session
    try:
        response = client.post(
            f"/publish-tasks/{task.id}/manual-complete",
            json={
                "status": "published",
                "live_url": "https://xhs.example/post/123",
                "operator_name": "ops-user",
            },
        )
        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_manual_publish_record_rejects_missing_live_url_for_publish():
    task = PublishTask(
        id=uuid.UUID("00000000-0000-0000-0000-000000000400"),
        team_id=uuid.UUID("00000000-0000-0000-0000-000000000401"),
        content_id=uuid.UUID("00000000-0000-0000-0000-000000000402"),
        adaptation_id=uuid.UUID("00000000-0000-0000-0000-000000000403"),
        channel_account_id=uuid.UUID("00000000-0000-0000-0000-000000000404"),
        task_type="publish_now",
        status="manual_action_required",
    )
    fake_session = PublishSession(task)
    app.dependency_overrides[publishing_router.get_db] = lambda: fake_session
    try:
        response = client.post(
            f"/publish-tasks/{task.id}/manual-complete",
            json={
                "status": "published",
                "operator_name": "ops-user",
            },
        )
        assert response.status_code == 400
    finally:
        app.dependency_overrides.clear()
