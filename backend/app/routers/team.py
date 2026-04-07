"""
Team route — direct port of app/api/team/route.ts
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.timesheet import Timesheet

router = APIRouter()


@router.get("/api/team")
def list_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    users = db.query(User).order_by(User.name).all()
    result = []
    for u in users:
        # Get latest timesheet for current client
        latest = (
            db.query(Timesheet.client_name)
            .filter(Timesheet.user_id == u.id)
            .order_by(desc(Timesheet.work_date))
            .first()
        )
        count = db.query(func.count(Timesheet.timesheet_id)).filter(
            Timesheet.user_id == u.id
        ).scalar()

        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "employeeId": u.employeeId or "",
            "designation": u.designation or "Employee",
            "department": u.department or "General",
            "managerId": u.managerId,
            "createdAt": u.createdAt.isoformat() if u.createdAt else None,
            "currentClient": latest[0] if latest else None,
            "timesheetCount": count or 0,
        })
    return result
