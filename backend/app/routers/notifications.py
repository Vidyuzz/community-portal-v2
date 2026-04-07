"""
Notification routes — direct port of app/api/notifications/route.ts
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter()


@router.get("/api/notifications")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(30)
        .all()
    )
    unread = sum(1 for n in notifications if not n.is_read)
    return {
        "notifications": [
            {
                "id": n.id,
                "user_id": n.user_id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifications
        ],
        "unread": unread,
    }


@router.post("/api/notifications/read")
def mark_notifications_read(
    body: dict = {},
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ids = body.get("ids", [])
    if ids and len(ids) > 0:
        db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.id.in_(ids),
        ).update({"is_read": True}, synchronize_session=False)
    else:
        db.query(Notification).filter(
            Notification.user_id == current_user.id,
        ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"success": True}
