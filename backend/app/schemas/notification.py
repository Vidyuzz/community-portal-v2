from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: int
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationsResponse(BaseModel):
    notifications: List[NotificationOut]
    unread: int


class MarkReadRequest(BaseModel):
    ids: Optional[List[int]] = None
