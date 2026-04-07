"""
Reminders route — direct port of app/api/reminders/send/route.ts
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import distinct

from app.dependencies import get_db, require_role
from app.models.user import User
from app.models.timesheet import Timesheet
from app.services.graph_email import send_reminder_email

router = APIRouter()


@router.post("/api/reminders/send")
def send_reminders(
    body: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    reminder_type = body.get("type", "weekly")
    users = db.query(User).all()

    sent = 0
    skipped = 0

    if reminder_type == "weekly":
        # Find start of current week (Monday)
        today = datetime.utcnow()
        week_start = today - timedelta(days=today.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = today.replace(hour=23, minute=59, second=59)

        submitted_ids = set(
            row[0]
            for row in db.query(distinct(Timesheet.user_id))
            .filter(
                Timesheet.work_date >= week_start,
                Timesheet.work_date <= end_of_day,
            )
            .all()
        )

        for u in users:
            if u.id in submitted_ids:
                skipped += 1
                continue
            background_tasks.add_task(
                send_reminder_email,
                to_email=u.email,
                employee_name=u.name,
                reminder_type="weekly",
            )
            sent += 1
    else:
        # Monthly — send to everyone
        for u in users:
            background_tasks.add_task(
                send_reminder_email,
                to_email=u.email,
                employee_name=u.name,
                reminder_type="monthly",
            )
            sent += 1

    return {"sent": sent, "skipped": skipped}
