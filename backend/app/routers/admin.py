"""
Admin routes — direct port of app/api/admin/*/route.ts
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.dependencies import get_db, require_role
from app.models.user import User
from app.models.timesheet import Timesheet
from app.models.client_submission import ClientSubmission
from app.models.month_lock import MonthLock

router = APIRouter()


# ── GET /api/admin/stats ────────────────────────────────────────────
@router.get("/api/admin/stats")
def admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if now.month == 12:
        month_end = now.replace(year=now.year + 1, month=1, day=1) - __import__("datetime").timedelta(seconds=1)
    else:
        month_end = now.replace(month=now.month + 1, day=1) - __import__("datetime").timedelta(seconds=1)

    total_employees = db.query(func.count(User.id)).scalar()
    submissions_this_month = db.query(func.count(ClientSubmission.id)).filter(
        ClientSubmission.submitted_at >= month_start,
        ClientSubmission.submitted_at <= month_end,
    ).scalar()
    locked_months = db.query(func.count(MonthLock.id)).scalar()
    pending_timesheets = db.query(func.count(Timesheet.timesheet_id)).filter(
        Timesheet.status == "Pending"
    ).scalar()

    return {
        "totalEmployees": total_employees,
        "submissionsThisMonth": submissions_this_month,
        "lockedMonths": locked_months,
        "pendingTimesheets": pending_timesheets,
    }


# ── GET /api/admin/users ────────────────────────────────────────────
@router.get("/api/admin/users")
def admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    users = db.query(User).order_by(User.name).all()
    result = []
    for u in users:
        mgr = db.query(User).filter(User.id == u.managerId).first() if u.managerId else None
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "employeeId": u.employeeId,
            "designation": u.designation,
            "department": u.department,
            "managerId": u.managerId,
            "leave_balance": u.leave_balance,
            "createdAt": u.createdAt.isoformat() if u.createdAt else None,
            "manager": {"name": mgr.name} if mgr else None,
        })
    return result


# ── PATCH /api/admin/users/{id} ─────────────────────────────────────
@router.patch("/api/admin/users/{id}")
def admin_update_user(
    id: str,
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    allowed = ["designation", "department", "managerId", "role", "leave_balance", "employeeId"]
    for key in allowed:
        if key in body:
            setattr(user, key, body[key])
    user.updatedAt = datetime.utcnow()

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "employeeId": user.employeeId,
        "designation": user.designation,
        "department": user.department,
        "managerId": user.managerId,
        "leave_balance": user.leave_balance,
        "azureOid": user.azureOid,
        "createdAt": user.createdAt.isoformat() if user.createdAt else None,
        "updatedAt": user.updatedAt.isoformat() if user.updatedAt else None,
    }


# ── GET /api/admin/locks ────────────────────────────────────────────
@router.get("/api/admin/locks")
def list_locks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    locks = db.query(MonthLock).order_by(desc(MonthLock.year), desc(MonthLock.month)).all()
    return [
        {
            "id": l.id,
            "year": l.year,
            "month": l.month,
            "locked_by": l.locked_by,
            "locked_at": l.locked_at.isoformat() if l.locked_at else None,
        }
        for l in locks
    ]


# ── POST /api/admin/locks ───────────────────────────────────────────
@router.post("/api/admin/locks", status_code=201)
def create_lock(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    year = body.get("year")
    month = body.get("month")

    if not year or not month or month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Valid year and month (1-12) are required")

    existing = db.query(MonthLock).filter(
        MonthLock.year == year, MonthLock.month == month
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="This month is already locked")

    lock = MonthLock(
        year=year,
        month=month,
        locked_by=current_user.id,
    )
    db.add(lock)
    db.commit()
    db.refresh(lock)

    return {
        "id": lock.id,
        "year": lock.year,
        "month": lock.month,
        "locked_by": lock.locked_by,
        "locked_at": lock.locked_at.isoformat() if lock.locked_at else None,
    }


# ── DELETE /api/admin/locks/{id} ────────────────────────────────────
@router.delete("/api/admin/locks/{id}")
def delete_lock(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    try:
        lock_id = int(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")

    lock = db.query(MonthLock).filter(MonthLock.id == lock_id).first()
    if not lock:
        raise HTTPException(status_code=404, detail="Lock not found")

    db.delete(lock)
    db.commit()
    return {"success": True}


# ── POST /api/admin/leave/bulk-credit ───────────────────────────────
@router.post("/api/admin/leave/bulk-credit")
def bulk_credit(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    amount = body.get("amount")
    if not amount or not isinstance(amount, (int, float)):
        raise HTTPException(status_code=400, detail="Invalid amount")

    users = db.query(User).all()
    for u in users:
        u.leave_balance = (u.leave_balance or 0) + amount
    db.commit()

    return {"updated": len(users), "amount": amount}
