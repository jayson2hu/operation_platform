from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.teams.router import router as teams_router
from app.modules.content.router import router as content_router
from app.modules.content.preview_router import router as content_preview_router
from app.modules.media.router import router as media_router
from app.modules.channel_accounts.router import router as channel_accounts_router
from app.modules.publishing.router import router as publishing_router
from app.modules.analytics.router import router as analytics_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(teams_router, prefix="/teams", tags=["teams"])
api_router.include_router(content_router, prefix="/contents", tags=["contents"])
api_router.include_router(content_preview_router, prefix="/contents", tags=["contents-preview"])
api_router.include_router(media_router, prefix="/media", tags=["media"])
api_router.include_router(channel_accounts_router, prefix="/channel-accounts", tags=["channel-accounts"])
api_router.include_router(publishing_router, prefix="/publish-tasks", tags=["publish-tasks"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
