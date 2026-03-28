from app.modules.channel_adapters.wechat_oa import WechatOAAdapter
from app.modules.channel_adapters.xiaohongshu import XiaohongshuAdapter


def get_adapter(channel_type: str):
    if channel_type == "xiaohongshu":
        return XiaohongshuAdapter()
    if channel_type == "wechat_oa":
        return WechatOAAdapter()
    raise ValueError(f"Unsupported channel_type: {channel_type}")
