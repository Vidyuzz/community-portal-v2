"""
Azure AD JWT validation service.
Currently only dev mode (portal_role cookie) is implemented.
Azure AD validation will be added when DEV_MODE=false.
"""

from app.config import settings


def is_dev_mode() -> bool:
    return settings.DEV_MODE or not settings.AZURE_AD_CLIENT_ID
