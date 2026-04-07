"""
Client approval route — direct port of app/api/client-approval/route.ts
Public endpoint, no auth required.
"""
from datetime import datetime
from urllib.parse import quote

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.config import settings
from app.models.client_submission import ClientSubmission
from app.models.notification import Notification

router = APIRouter()


@router.get("/api/client-approval")
def client_approval(
    token: str = Query(None),
    action: str = Query(None),
    note: str = Query(None),
    db: Session = Depends(get_db),
):
    base = settings.FRONTEND_URL

    if not token or not action or action not in ("approve", "reject"):
        return RedirectResponse(url=f"{base}/client-approval/invalid")

    submission = db.query(ClientSubmission).filter(
        ClientSubmission.approval_token == token
    ).first()

    if not submission:
        return RedirectResponse(url=f"{base}/client-approval/invalid")

    if submission.cs_status != "Pending":
        return RedirectResponse(url=f"{base}/client-approval/already-responded")

    new_status = "Approved" if action == "approve" else "Rejected"

    submission.cs_status = new_status
    submission.responded_at = datetime.utcnow()
    submission.rejection_note = note if action == "reject" else None
    db.commit()

    # Create notification for employee
    if new_status == "Approved":
        notif_title = "Client Approved Your Timesheet"
        notif_message = (
            f"Your timesheet submitted to {submission.client_name} "
            f"was approved by {submission.client_manager_name}."
        )
        notif_type = "client_approved"
    else:
        notif_title = "Client Rejected Your Timesheet"
        notif_message = (
            f"Your timesheet submitted to {submission.client_name} "
            f"was rejected by {submission.client_manager_name}."
        )
        if note:
            notif_message += f" Note: {note}"
        notif_type = "client_rejected"

    notif = Notification(
        user_id=submission.user_id,
        title=notif_title,
        message=notif_message,
        type=notif_type,
    )
    db.add(notif)
    db.commit()

    client_name = quote(submission.client_name)
    return RedirectResponse(
        url=f"{base}/client-approval/confirmed?action={action}&client={client_name}"
    )
