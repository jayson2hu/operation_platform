from app.modules.channel_adapters.base import ChannelAdapter


class WechatOAAdapter(ChannelAdapter):
    channel_type = "wechat_oa"

    def generate(self, source_content: dict, account_context: dict) -> dict:
        title = source_content.get("source_title", "")
        summary = source_content.get("source_summary", "")
        cta = source_content.get("source_cta", "")
        body = f"<p>{summary}</p><p>{cta}</p>"

        return {
            "channel_type": self.channel_type,
            "title": title,
            "body": body,
            "structured_payload": {
                "digest": summary,
                "cover_media_id": None,
                "author": None,
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
        if not structured.get("digest"):
            errors.append({
                "code": "WECHAT_DIGEST_REQUIRED",
                "field": "digest",
                "level": "blocked",
                "message": "公众号文章摘要不能为空",
            })

        if not structured.get("cover_media_id"):
            errors.append({
                "code": "WECHAT_COVER_REQUIRED",
                "field": "cover_media_id",
                "level": "blocked",
                "message": "公众号文章封面不能为空",
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
        structured = adaptation.get("structured_payload", {})
        return {
            "title": adaptation.get("title"),
            "content": adaptation.get("body"),
            "digest": structured.get("digest"),
            "author": structured.get("author"),
            "cover_media_id": structured.get("cover_media_id"),
        }

    def publish(self, publish_payload: dict, account_context: dict) -> dict:
        """
        Publish to WeChat OA using official WeChat API.
        Currently returns a simulated response for MVP.
        Will be integrated with actual WeChat API.
        """
        try:
            access_token = account_context.get("access_token")
            if not access_token:
                return {
                    "status": "failed",
                    "error_message": "Missing WeChat access_token",
                }

            # TODO: Implement actual WeChat API call
            # POST https://api.weixin.qq.com/cgi-bin/draft/add
            # POST https://api.weixin.qq.com/cgi-bin/draft/publish

            # For MVP, simulate successful publish
            return {
                "external_post_id": f"wechat_{access_token[:8]}_{hash(str(publish_payload)) % 10000:04d}",
                "live_url": f"https://mp.weixin.qq.com/bizmall/malldetail/id=...",
                "status": "success",
            }
        except Exception as e:
            return {
                "status": "failed",
                "error_message": f"WeChat publish error: {str(e)}",
            }
