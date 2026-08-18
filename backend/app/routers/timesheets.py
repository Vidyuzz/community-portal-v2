"""
Timesheet routes — direct port of app/api/timesheets/route.ts and [id]/route.ts
"""
import re
import uuid
import base64
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.timesheet import Timesheet
from app.models.client_submission import ClientSubmission
from app.models.month_lock import MonthLock
from app.services.graph_email import (
    send_timesheet_to_client,
    send_submission_confirmation,
    email_configured,
)
from app.services.csv_service import get_timesheet_filename

router = APIRouter()


# ── Leave balance accounting ────────────────────────────────────────
# Days debited from the employee's leave balance per day type.
# Working and Holiday cost nothing.
LEAVE_COST = {
    "Leave": 1.0,
    "HalfDay": 0.5,
}


# Hours the employee may log against each day type. The type is chosen
# explicitly; hours are then constrained to that type's band. 6 is valid for
# both — a 6-hour day can be logged either way, and the employee decides.
HOURS_RANGE = {
    "HalfDay": (4.0, 6.0),
    "Working": (6.0, 12.0),
}


def _day_type_value(value) -> str:
    """`type_of_day` comes back as a DayType enum from the ORM, a str from the request body."""
    return value.value if hasattr(value, "value") else str(value or "")


def _leave_cost(type_of_day) -> float:
    return LEAVE_COST.get(_day_type_value(type_of_day), 0.0)


def _fmt_days(value: float) -> str:
    """1.0 -> '1', 1.25 -> '1.25' — keeps error messages readable."""
    return f"{value:.2f}".rstrip("0").rstrip(".") or "0"


def _apply_leave_delta(user: User, delta: float) -> None:
    """Debit (delta > 0) or refund (delta < 0) the user's balance.

    The balance floors at zero rather than blocking the entry. Leave taken with
    no balance left is loss of pay, which payroll handles outside the portal —
    and letting the balance go negative would wrongly eat into the next monthly
    credit, charging the employee twice for the same day.

    Rounded to 2 dp on every write: balances move in 0.25/0.5 steps and
    accumulate float drift otherwise.
    """
    if user is None or delta == 0:
        return
    balance = user.leave_balance or 0.0
    user.leave_balance = round(max(0.0, balance - delta), 2)


def _validate_hours(type_of_day, hours) -> None:
    band = HOURS_RANGE.get(_day_type_value(type_of_day))
    if band is None:
        return  # Leave/Holiday carry no hours
    if hours is None:
        raise HTTPException(
            status_code=400,
            detail=f"Hours are required for a {_day_type_value(type_of_day)} entry.",
        )
    low, high = band
    if not (low - 1e-9 <= float(hours) <= high + 1e-9):
        label = "half-day" if _day_type_value(type_of_day) == "HalfDay" else "full day"
        raise HTTPException(
            status_code=400,
            detail=f"A {label} entry must be between {_fmt_days(low)} and {_fmt_days(high)} hours.",
        )


def _existing_entry_on(
    db: Session, user_id: str, when: datetime, exclude_id: Optional[int] = None
) -> Optional[Timesheet]:
    """An entry the user already has on that calendar day, if any.

    Matched on a day range rather than equality — work_date carries a time
    component for older rows.
    """
    day_start = when.replace(hour=0, minute=0, second=0, microsecond=0)
    query = db.query(Timesheet).filter(
        Timesheet.user_id == user_id,
        Timesheet.work_date >= day_start,
        Timesheet.work_date < day_start + timedelta(days=1),
    )
    if exclude_id is not None:
        query = query.filter(Timesheet.timesheet_id != exclude_id)
    return query.first()


def _entry_owner(db: Session, entry: Timesheet) -> User:
    """The balance always moves on the entry's owner, never on whoever is editing it."""
    return entry.user or db.query(User).filter(User.id == entry.user_id).first()


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
        "created_at": entry.created_at.isoformat() + "Z" if entry.created_at else None,
        "updated_at": entry.updated_at.isoformat() + "Z" if entry.updated_at else None,
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
            # Manager view: all entries from all users, grouped.
            # joinedload because this is the one view that reads entry.user.
            query = db.query(Timesheet).options(joinedload(Timesheet.user))
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

        work_date = datetime.fromisoformat(body["work_date"])
        clash = _existing_entry_on(db, current_user.id, work_date)
        if clash:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"An entry for {work_date.strftime('%d %b %Y')} already exists. "
                    f"Edit the existing entry instead."
                ),
            )

        type_of_day = body.get("type_of_day", "Working")
        _validate_hours(type_of_day, body.get("hours_worked"))

        # Validate the debit before writing anything.
        _apply_leave_delta(current_user, _leave_cost(type_of_day))

        entry = Timesheet(
            user_id=current_user.id,
            client_name=body.get("client_name"),
            project_name=body.get("project_name"),
            work_date=work_date,
            type_of_day=type_of_day,
            hours_worked=body.get("hours_worked"),
            comments=body.get("comments"),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(entry)
        # One commit for the entry and the debit together.
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
        if existing.user_id != current_user.id and current_user.role != "ADMIN":
            raise HTTPException(status_code=404, detail="Entry not found")

        created = existing.created_at or existing.updated_at
        if created and (datetime.utcnow() - created) > timedelta(days=14):
            raise HTTPException(status_code=403, detail="Entry is locked after 2 weeks and cannot be edited.")

        if _is_month_locked(db, existing.work_date):
            raise HTTPException(
                status_code=403,
                detail="This month has been locked by an admin and cannot be modified.",
            )

        if "work_date" in body:
            moved_to = datetime.fromisoformat(body["work_date"])
            clash = _existing_entry_on(db, existing.user_id, moved_to, exclude_id=existing.timesheet_id)
            if clash:
                raise HTTPException(
                    status_code=409,
                    detail=f"An entry for {moved_to.strftime('%d %b %Y')} already exists.",
                )

        # Validate against the entry as it will look after the patch, not just
        # the fields being sent — switching type alone can invalidate the hours.
        if "type_of_day" in body or "hours_worked" in body:
            next_type = body.get("type_of_day", existing.type_of_day)
            next_hours = body["hours_worked"] if "hours_worked" in body else existing.hours_worked
            _validate_hours(next_type, next_hours)

        if "type_of_day" in body:
            # Settle the difference only: Working -> Leave debits 1, Leave -> Working
            # refunds it, Leave -> HalfDay refunds 0.5.
            delta = _leave_cost(body["type_of_day"]) - _leave_cost(existing.type_of_day)
            _apply_leave_delta(_entry_owner(db, existing), delta)

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
        if existing.user_id != current_user.id and current_user.role != "ADMIN":
            raise HTTPException(status_code=404, detail="Entry not found")
        created = existing.created_at or existing.updated_at
        if created and (datetime.utcnow() - created) > timedelta(days=14):
            raise HTTPException(status_code=403, detail="Entry is locked after 2 weeks and cannot be deleted.")
        if _is_month_locked(db, existing.work_date):
            raise HTTPException(
                status_code=403,
                detail="This month has been locked by an admin and cannot be modified.",
            )

        # Deleting a leave entry hands the day back.
        _apply_leave_delta(_entry_owner(db, existing), -_leave_cost(existing.type_of_day))
        db.delete(existing)
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


# ── GET /api/locks ──────────────────────────────────────────────────
@router.get("/api/locks")
def list_month_locks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Read-only month locks for any signed-in user.

    The timesheet calendar greys out locked months for everyone, so it cannot
    use the admin-only /api/admin/locks (that returned 403 for employees).
    Admin CRUD on locks still lives in the admin router.
    """
    locks = db.query(MonthLock).order_by(desc(MonthLock.year), desc(MonthLock.month)).all()
    return [{"year": l.year, "month": l.month} for l in locks]


# ── GET /api/timesheets/submissions ─────────────────────────────────
@router.get("/api/timesheets/submissions")
def list_submissions(
    all: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if all == "1" and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")

    query = db.query(ClientSubmission).options(joinedload(ClientSubmission.user))
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

        # Acknowledge to the employee — without this a submission is silent.
        background_tasks.add_task(
            send_submission_confirmation,
            to_email=current_user.email,
            employee_name=current_user.name,
            client_name=client_name,
            client_manager_name=client_manager_name,
            client_manager_email=client_manager_email,
            from_date=from_label,
            to_date=to_label,
        )

        # Mail silently no-ops when Azure/Graph creds are missing; say so instead
        # of reporting a success the user will never see in their inbox.
        return {
            "success": True,
            "submissionId": submission.id,
            "email_sent": email_configured(),
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")
