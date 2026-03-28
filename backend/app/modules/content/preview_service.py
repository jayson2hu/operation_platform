from dataclasses import dataclass
from typing import Any, Dict
import hashlib
import json

from app.modules.channel_adapters.factory import get_adapter


@dataclass
class PreviewBundle:
    content_id: str
    version_no: int
    channel_type: str
    rendered_preview: Dict[str, Any]
    copy_payload: Dict[str, Any]
    validation: Dict[str, Any]


@dataclass
class CopyPackBundle:
    content_id: str
    version_no: int
    channel_type: str
    copy_payload: Dict[str, Any]
    validation: Dict[str, Any]


@dataclass
class ApprovalPackBundle:
    content_id: str
    version_no: int
    channel_type: str
    rendered_preview: Dict[str, Any]
    copy_payload: Dict[str, Any]
    validation: Dict[str, Any]
    is_latest_version: bool
    approval_state: str
    snapshot_hash: str


class PreviewService:
    def build_preview(self, content: dict, version: dict, channel_type: str) -> PreviewBundle:
        adapter = get_adapter(channel_type)
        account_context = {"publish_mode": "hybrid"}
        source = self._build_source(content, version)
        adaptation = adapter.generate(source, account_context)
        validation = adapter.validate(adaptation, account_context)
        copy_payload = self._build_copy_payload(channel_type, adaptation)
        rendered_preview = {
            "channel_type": channel_type,
            "title": adaptation.get("title"),
            "body": adaptation.get("body"),
            "structured_payload": adaptation.get("structured_payload", {}),
        }
        return PreviewBundle(
            content_id=str(content["id"]),
            version_no=version["version_no"],
            channel_type=channel_type,
            rendered_preview=rendered_preview,
            copy_payload=copy_payload,
            validation=validation,
        )

    def build_copy_pack(self, content: dict, version: dict, channel_type: str) -> CopyPackBundle:
        preview_bundle = self.build_preview(content, version, channel_type)
        return CopyPackBundle(
            content_id=preview_bundle.content_id,
            version_no=preview_bundle.version_no,
            channel_type=preview_bundle.channel_type,
            copy_payload=preview_bundle.copy_payload,
            validation=preview_bundle.validation,
        )

    def build_approval_pack(self, content: dict, version: dict, channel_type: str, is_latest_version: bool) -> ApprovalPackBundle:
        preview_bundle = self.build_preview(content, version, channel_type)
        approval_state = self._build_approval_state(preview_bundle.validation, is_latest_version)
        snapshot_hash = self._build_snapshot_hash(preview_bundle, is_latest_version, approval_state)
        return ApprovalPackBundle(
            content_id=preview_bundle.content_id,
            version_no=preview_bundle.version_no,
            channel_type=preview_bundle.channel_type,
            rendered_preview=preview_bundle.rendered_preview,
            copy_payload=preview_bundle.copy_payload,
            validation=preview_bundle.validation,
            is_latest_version=is_latest_version,
            approval_state=approval_state,
            snapshot_hash=snapshot_hash,
        )

    def _build_source(self, content: dict, version: dict) -> dict:
        payload = dict(version.get("source_payload", {}))
        return {
            "source_title": payload.get("source_title", content["source_title"]),
            "source_summary": payload.get("source_summary", content.get("source_summary")),
            "source_cta": payload.get("source_cta", content.get("source_cta")),
            "keyword_set": payload.get("keyword_set", content.get("keyword_set", [])),
        }

    def _build_copy_payload(self, channel_type: str, adaptation: dict) -> dict:
        structured = adaptation.get("structured_payload", {})
        if channel_type == "xiaohongshu":
            hashtags = structured.get("hashtags", [])
            return {
                "title": adaptation.get("title"),
                "body": adaptation.get("body"),
                "hashtags": hashtags,
                "copy_text": "\n\n".join([
                    adaptation.get("title", ""),
                    adaptation.get("body", ""),
                    " ".join(hashtags),
                ]).strip(),
            }
        if channel_type == "wechat_oa":
            return {
                "title": adaptation.get("title"),
                "digest": structured.get("digest"),
                "html": adaptation.get("body"),
                "author": structured.get("author"),
            }
        return {
            "title": adaptation.get("title"),
            "body": adaptation.get("body"),
        }

    def _build_approval_state(self, validation: dict, is_latest_version: bool) -> str:
        if not is_latest_version:
            return "stale"
        if validation.get("status") == "blocked":
            return "blocked"
        if validation.get("status") == "warning":
            return "needs_review"
        return "ready"

    def _build_snapshot_hash(self, preview_bundle: PreviewBundle, is_latest_version: bool, approval_state: str) -> str:
        snapshot = {
            "content_id": preview_bundle.content_id,
            "version_no": preview_bundle.version_no,
            "channel_type": preview_bundle.channel_type,
            "rendered_preview": preview_bundle.rendered_preview,
            "copy_payload": preview_bundle.copy_payload,
            "validation": preview_bundle.validation,
            "is_latest_version": is_latest_version,
            "approval_state": approval_state,
        }
        raw = json.dumps(snapshot, sort_keys=True, ensure_ascii=False, default=str)
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()
