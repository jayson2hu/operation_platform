from app.modules.channel_adapters.base import ChannelAdapter


class XiaohongshuAdapter(ChannelAdapter):
    channel_type = "xiaohongshu"

    def generate(self, source_content: dict, account_context: dict) -> dict:
        title = source_content.get("source_title", "")
        summary = source_content.get("source_summary", "")
        cta = source_content.get("source_cta", "")
        keywords = source_content.get("keyword_set", [])

        hashtags = [f"#{kw}" for kw in keywords[:5]]
        body_parts = [summary.strip(), "", cta.strip(), "", " ".join(hashtags)]
        body = "\n".join([part for part in body_parts if part is not None])

        return {
            "channel_type": self.channel_type,
            "title": title,
            "body": body,
            "structured_payload": {
                "hashtags": hashtags,
                "cover_media_id": None,
            },
        }

    def validate(self, adaptation: dict, account_context: dict) -> dict:
        errors = []
        warnings = []

        if not adaptation.get("title"):
            errors.append({
                "code": "MISSING_TITLE",
                "field": "title",
                "level": "blocked",
                "message": "标题不能为空",
            })

        if not adaptation.get("body"):
            errors.append({
                "code": "MISSING_BODY",
                "field": "body",
                "level": "blocked",
                "message": "正文不能为空",
            })

        structured = adaptation.get("structured_payload", {})
        if not structured.get("cover_media_id"):
            errors.append({
                "code": "XHS_COVER_REQUIRED",
                "field": "cover_media_id",
                "level": "blocked",
                "message": "小红书必须选择封面图",
            })

        if not structured.get("hashtags"):
            warnings.append({
                "code": "XHS_HASHTAGS_TOO_FEW",
                "field": "hashtags",
                "level": "warning",
                "message": "建议补充相关话题标签",
            })

        status = "blocked" if errors else ("warning" if warnings else "valid")
        return {
            "status": status,
            "errors": errors,
            "warnings": warnings,
        }

    def build_publish_payload(
        self,
        adaptation: dict,
        media_variants: list[dict],
        account_context: dict,
    ) -> dict:
        return {
            "title": adaptation.get("title"),
            "body": adaptation.get("body"),
            "media": media_variants,
            "publish_mode": account_context.get("publish_mode", "hybrid"),
        }

    def publish(self, publish_payload: dict, account_context: dict) -> dict:
        """
        Publish to Xiaohongshu using complete API interface.
        Currently returns a simulated response for MVP.
        Will be integrated with actual Xiaohongshu API.
        """
        try:
            account_id = account_context.get("account_id")
            if not account_id:
                return {
                    "status": "failed",
                    "error_message": "Missing Xiaohongshu account_id",
                }

            # TODO: Implement actual Xiaohongshu API call
            # POST https://api.xiaohongshu.com/web_api/feed/post/publish

            # For MVP, simulate successful publish
            return {
                "external_post_id": f"xhs_{account_id[:8]}_{hash(str(publish_payload)) % 100000:05d}",
                "live_url": f"https://www.xiaohongshu.com/explore/...",
                "status": "success",
            }
        except Exception as e:
            return {
                "status": "failed",
                "error_message": f"Xiaohongshu publish error: {str(e)}",
            }
