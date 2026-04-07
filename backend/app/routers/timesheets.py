"""
Timesheet routes — direct port of app/api/timesheets/route.ts and [id]/route.ts
"""
import re
import uuid
import base64
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.timesheet import Timesheet
from app.models.client_submission import ClientSubmission
from app.models.notification import Notification
from app.models.month_lock import MonthLock
from app.services.graph_email import send_status_email, send_timesheet_to_client
from app.services.csv_service import get_timesheet_filename

router = APIRouter()


def _is_month_locked(db: Session, date: datetime) -> bool:
    year = date.year
    month = date.month
    lock = db.query(MonthLock).filter(
        MonthLock.year == year, MonthLock.month == month
    ).first()
    return lock is not None


def _timesheet_to_dict(entry: Timesheet, include_user: bool = False) -> dict:
    d = {
        "timesheet_id": entry.timesheet_id,
        "user_id": entry.user_id,
        "client_name": entry.client_name,
        "project_name": entry.project_name,
        "work_date": entry.work_date.isoformat() + ("Z" if not str(entry.work_date).endswith("Z") else ""),
        "type_of_day": entry.type_of_day,
        "hours_worked": entry.hours_worked,
        "comments": entry.comments,
        "status": entry.status,
        "manager_reason": entry.manager_reason,
        "updated_at": entry.updated_at.isoformat() + ("Z" if not str(entry.updated_at).endswith("Z") else "") if entry.updated_at else None,
    }
    if include_user and entry.user:
        d["user"] = {"name": entry.user.name, "email": entry.user.email}
    return d


def _submission_to_dict(sub: ClientSubmission) -> dict:
    d = {
        "id": sub.id,
        "user_id": sub.user_id,
        "client_name": sub.client_name,
        "client_manager_name": sub.client_manager_name,
        "client_manager_email": sub.client_manager_email,
        "from_date": sub.from_date.isoformat(),
        "to_date": sub.to_date.isoformat(),
        "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
        "approval_token": sub.approval_token,
        "cs_status": sub.cs_status,
        "responded_at": sub.responded_at.isoformat() if sub.responded_at else None,
        "rejection_note": sub.rejection_note,
    }
    if sub.user:
        d["user"] = {"name": sub.user.name, "email": sub.user.email}
    return d


# ── GET /api/timesheets ─────────────────────────────────────────────
@router.get("/api/timesheets")
def list_timesheets(
    status: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    role: Optional[str] = Query(None),
    view: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        if role == "manager" or view == "manager":
            # Manager view: all entries from all users, grouped
            query = db.query(Timesheet)
            if status:
                query = query.filter(Timesheet.status == status)
            if from_date:
                query = query.filter(Timesheet.work_date >= datetime.fromisoformat(from_date))
            if to_date:
                query = query.filter(Timesheet.work_date <= datetime.fromisoformat(to_date))
            entries = query.order_by(desc(Timesheet.work_date)).all()

            # Group by user
            grouped = {}
            for entry in entries:
                uid = entry.user_id
                if uid not in grouped:
                    grouped[uid] = {
                        "user_id": uid,
                        "full_name": entry.user.name if entry.user else "",
                        "email": entry.user.email if entry.user else "",
                        "entries": [],
                    }
                grouped[uid]["entries"].append(_timesheet_to_dict(entry, include_user=True))
            return list(grouped.values())

        # Employee view: only own entries
        query = db.query(Timesheet).filter(Timesheet.user_id == current_user.id)
        if status:
            query = query.filter(Timesheet.status == status)
        if from_date:
            query = query.filter(Timesheet.work_date >= datetime.fromisoformat(from_date))
        if to_date:
            query = query.filter(Timesheet.work_date <= datetime.fromisoformat(to_date))
        entries = query.order_by(desc(Timesheet.work_date)).all()
        return [_timesheet_to_dict(e) for e in entries]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


# ── POST /api/timesheets ────────────────────────────────────────────
@router.post("/api/timesheets", status_code=201)
def create_timesheet(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        if not body.get("work_date"):
            raise HTTPException(status_code=400, detail="work_date is required")

        entry = Timesheet(
            user_id=current_user.id,
            client_name=body.get("client_name"),
            project_name=body.get("project_name"),
            work_date=datetime.fromisoformat(body["work_date"]),
            type_of_day=body.get("type_of_day", "Working"),
            hours_worked=body.get("hours_worked"),
            comments=body.get("comments"),
            status="Pending",
            updated_at=datetime.utcnow(),
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return _timesheet_to_dict(entry)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


# ── PATCH /api/timesheets/{id} ──────────────────────────────────────
@router.patch("/api/timesheets/{id}")
def update_timesheet(
    id: str,
    body: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        timesheet_id = int(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")

    try:
        # Manager status update
        if "status" in body:
            if body["status"] == "Denied" and not (body.get("manager_reason") or "").strip():
                raise HTTPException(
                    status_code=400,
                    detail="manager_reason is required when denying",
                )

            entry = db.query(Timesheet).filter(Timesheet.timesheet_id == timesheet_id).first()
            if not entry:
                raise HTTPException(status_code=404, detail="Entry not found")

            entry.status = body["status"]
            entry.manager_reason = body.get("manager_reason")
            entry.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(entry)

            # Create notification
            if body["status"] == "Approved":
                title = "Timesheet Approved"
                msg = f"Your entry for {entry.work_date.strftime('%d %b %Y')} has been approved."
                notif_type = "approval"
            else:
                title = "Timesheet Denied"
                msg = f"Your entry for {entry.work_date.strftime('%d %b %Y')} was denied. Reason: {body.get('manager_reason', '')}"
                notif_type = "denial"

            notif = Notification(
                user_id=entry.user_id,
                title=title,
                message=msg,
                type=notif_type,
            )
            db.add(notif)
            db.commit()

            # Fire-and-forget email
            if entry.user:
                background_tasks.add_task(
                    send_status_email,
                    to_email=entry.user.email,
                    employee_name=entry.user.name,
                    status=body["status"],
                    work_date=entry.work_date.strftime("%d %b %Y"),
                    project_name=entry.project_name,
                    client_name=entry.client_name,
                    manager_reason=entry.manager_reason,
                )

            return _timesheet_to_dict(entry, include_user=True)

        # Employee edit
        existing = db.query(Timesheet).filter(Timesheet.timesheet_id == timesheet_id).first()
        if not existing:
            raise HTTPException(status_code=404, detail="Entry not found")
        if existing.status != "Pending":
            raise HTTPException(status_code=400, detail="Only Pending entries can be edited")
        if _is_month_locked(db, existing.work_date):
            raise HTTPException(
                status_code=403,
                detail="This month has been locked by an admin and cannot be modified.",
            )

        if "client_name" in body:
            existing.client_name = body["client_name"]
        if "project_name" in body:
            existing.project_name = body["project_name"]
        if "work_date" in body:
            existing.work_date = datetime.fromisoformat(body["work_date"])
        if "type_of_day" in body:
            existing.type_of_day = body["type_of_day"]
        if "hours_worked" in body:
            existing.hours_worked = body["hours_worked"]
        if "comments" in body:
            existing.comments = body["comments"]
        existing.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(existing)
        return _timesheet_to_dict(existing)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


# ── DELETE /api/timesheets/{id} ─────────────────────────────────────
@router.delete("/api/timesheets/{id}")
def delete_timesheet(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        timesheet_id = int(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")

    try:
        existing = db.query(Timesheet).filter(Timesheet.timesheet_id == timesheet_id).first()
        if not existing:
            raise HTTPException(status_code=404, detail="Entry not found")
        if existing.status != "Pending":
            raise HTTPException(status_code=400, detail="Only Pending entries can be deleted")
        if _is_month_locked(db, existing.work_date):
            raise HTTPException(
                status_code=403,
                detail="This month has been locked by an admin and cannot be modified.",
            )

        db.delete(existing)
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


# ── GET /api/timesheets/submissions ─────────────────────────────────
@router.get("/api/timesheets/submissions")
def list_submissions(
    all: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if all == "1" and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")

    query = db.query(ClientSubmission)
    if all != "1":
        query = query.filter(ClientSubmission.user_id == current_user.id)
    submissions = query.order_by(desc(ClientSubmission.submitted_at)).all()
    return [_submission_to_dict(s) for s in submissions]


# ── POST /api/timesheets/submit-client ──────────────────────────────
@router.post("/api/timesheets/submit-client", status_code=201)
def submit_to_client(
    body: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        client_name = body.get("client_name")
        client_manager_name = body.get("client_manager_name")
        client_manager_email = body.get("client_manager_email")
        from_date = body.get("from_date")
        to_date = body.get("to_date")
        csv_content = body.get("csv_content")

        if not all([client_name, client_manager_name, client_manager_email, from_date, to_date, csv_content]):
            raise HTTPException(status_code=400, detail="All fields are required")

        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", client_manager_email):
            raise HTTPException(status_code=400, detail="Invalid client manager email")

        token = str(uuid.uuid4()).replace("-", "")[:25]

        submission = ClientSubmission(
            user_id=current_user.id,
            client_name=client_name,
            client_manager_name=client_manager_name,
            client_manager_email=client_manager_email,
            from_date=datetime.fromisoformat(from_date),
            to_date=datetime.fromisoformat(to_date),
            approval_token=token,
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)

        # Format dates for email
        from_dt = datetime.fromisoformat(from_date)
        to_dt = datetime.fromisoformat(to_date)
        from_label = from_dt.strftime("%d %b %Y")
        to_label = to_dt.strftime("%d %b %Y")
        csv_filename = f"{current_user.name.replace(' ', '_')}_Timesheet_{from_dt.strftime('%d-%m-%Y')}_to_{to_dt.strftime('%d-%m-%Y')}.csv"

        # Decode base64 CSV
        try:
            decoded_csv = base64.b64decode(csv_content).decode("utf-8")
        except Exception:
            decoded_csv = csv_content

        background_tasks.add_task(
            send_timesheet_to_client,
            to_email=client_manager_email,
            client_manager_name=client_manager_name,
            employee_name=current_user.name,
            from_date=from_label,
            to_date=to_label,
            csv_content=decoded_csv,
            csv_filename=csv_filename,
            approval_token=token,
        )

        return {"success": True, "submissionId": submission.id}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")
