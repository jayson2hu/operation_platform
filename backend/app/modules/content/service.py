from copy import deepcopy

from sqlalchemy.orm import Session

from app.models.content import Content
from app.models.content_version import ContentVersion
from app.schemas.content import ContentCreate, ContentVersionCreate, ContentVersionReviseRequest


class ContentRevisionError(Exception):
    pass


class ContentRevisionConflict(ContentRevisionError):
    pass


class ContentService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_content(self, data: ContentCreate) -> Content:
        content = Content(
            team_id=data.team_id,
            objective=data.objective,
            audience=data.audience,
            campaign_name=data.campaign_name,
            source_title=data.source_title,
            source_summary=data.source_summary,
            source_cta=data.source_cta,
            keyword_set=data.keyword_set,
            created_by=data.created_by,
        )
        self.db.add(content)
        self.db.commit()
        self.db.refresh(content)
        return content

    def list_contents(self, team_id=None) -> list[Content]:
        query = self.db.query(Content)
        if team_id is not None:
            query = query.filter(Content.team_id == team_id)
        return query.order_by(Content.created_at.desc()).all()

    def create_version(self, content_id, data: ContentVersionCreate) -> ContentVersion:
        latest_version = self._get_latest_version(content_id)
        next_version_no = 1 if latest_version is None else latest_version.version_no + 1
        version = ContentVersion(
            content_id=content_id,
            version_no=next_version_no,
            source_payload=data.source_payload,
            created_by=data.created_by,
        )
        self.db.add(version)
        self.db.commit()
        self.db.refresh(version)
        return version

    def revise_version(
        self,
        content_id,
        base_version_no: int,
        data: ContentVersionReviseRequest,
    ) -> ContentVersion:
        content = self.db.query(Content).filter(Content.id == content_id).first()
        if content is None:
            raise ContentRevisionError("Content not found")

        latest_version = self._get_latest_version(content_id)
        if latest_version is None:
            raise ContentRevisionError("Content version not found")
        if latest_version.version_no != base_version_no:
            raise ContentRevisionConflict("Base version is stale")

        base_version = self._get_version(content_id, base_version_no)
        if base_version is None:
            raise ContentRevisionError("Content version not found")

        revision_patch = self._build_revision_patch(data)
        if not revision_patch:
            raise ContentRevisionError("Revision patch cannot be empty")

        merged_payload = _deep_merge(base_version.source_payload or {}, revision_patch)
        if merged_payload == (base_version.source_payload or {}):
            raise ContentRevisionError("Revision patch does not change content")

        self._apply_content_field_updates(content, data)

        version = ContentVersion(
            content_id=content_id,
            version_no=latest_version.version_no + 1,
            source_payload=merged_payload,
            created_by=data.created_by,
        )
        self.db.add(version)
        self.db.commit()
        self.db.refresh(content)
        self.db.refresh(version)
        return version

    def list_versions(self, content_id) -> list[ContentVersion]:
        return (
            self.db.query(ContentVersion)
            .filter(ContentVersion.content_id == content_id)
            .order_by(ContentVersion.version_no.desc())
            .all()
        )

    def _get_latest_version(self, content_id):
        return (
            self.db.query(ContentVersion)
            .filter(ContentVersion.content_id == content_id)
            .order_by(ContentVersion.version_no.desc())
            .first()
        )

    def _get_version(self, content_id, version_no: int):
        return (
            self.db.query(ContentVersion)
            .filter(ContentVersion.content_id == content_id, ContentVersion.version_no == version_no)
            .first()
        )

    def _build_revision_patch(self, data: ContentVersionReviseRequest) -> dict:
        patch = deepcopy(data.source_payload_patch or {})

        if data.source_title is not None:
            patch["source_title"] = data.source_title
        if data.source_summary is not None:
            patch["source_summary"] = data.source_summary
        if data.source_cta is not None:
            patch["source_cta"] = data.source_cta
        if data.keyword_set is not None:
            patch["keyword_set"] = data.keyword_set

        return patch

    def _apply_content_field_updates(self, content: Content, data: ContentVersionReviseRequest) -> None:
        if data.source_title is not None:
            content.source_title = data.source_title
        if data.source_summary is not None:
            content.source_summary = data.source_summary
        if data.source_cta is not None:
            content.source_cta = data.source_cta
        if data.keyword_set is not None:
            content.keyword_set = data.keyword_set


def _deep_merge(base, patch):
    if not isinstance(base, dict) or not isinstance(patch, dict):
        return deepcopy(patch)

    merged = deepcopy(base)
    for key, value in patch.items():
        if isinstance(merged.get(key), dict) and isinstance(value, dict):
            merged[key] = _deep_merge(merged[key], value)
        else:
            merged[key] = deepcopy(value)
    return merged
