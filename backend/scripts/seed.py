"""
Seed script — populates the database with mock data for development.
Run from backend/: python -m scripts.seed
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime, timedelta
from app.database import engine, SessionLocal, Base
from app.models import (
    User, Timesheet, ClientSubmission, Notification,
    MonthLock, Holiday, NewHire, Anniversary,
)


def seed():
    # Create tables
    import app.models  # noqa
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Clear existing
        for model in [Notification, ClientSubmission, Timesheet, MonthLock, Holiday, NewHire, Anniversary]:
            db.query(model).delete()
        db.query(User).delete()
        db.commit()

        # ── Users ──
        employee = User(
            id="mock-user-raj-kumar",
            azureOid="mock-azure-oid-raj",
            email="raj.kumar@gsrgroup.in",
            name="Raj Kumar",
            role="EMPLOYEE",
            designation="Software Engineer",
            department="Engineering",
            employeeId="GSR-001",
            leave_balance=8.5,
        )
        admin_user = User(
            id="mock-user-admin",
            azureOid="mock-azure-oid-admin",
            email="admin@gsrgroup.in",
            name="Admin User",
            role="ADMIN",
            designation="HR Admin",
            department="Human Resources",
            employeeId="GSR-003",
            leave_balance=15.0,
        )
        db.add_all([employee, admin_user])
        db.flush()

        # ── Timesheets ──
        now = datetime.utcnow()
        entries = []
        for i in range(20):
            day_offset = i
            work_date = now - timedelta(days=day_offset)
            if work_date.weekday() >= 5:  # skip weekends
                continue
            status = "Pending" if i < 5 else ("Approved" if i < 15 else "Denied")
            entries.append(Timesheet(
                user_id="mock-user-raj-kumar",
                client_name="Acme Corp" if i % 2 == 0 else "TechVista Inc",
                project_name="Portal Migration" if i % 2 == 0 else "Dashboard Redesign",
                work_date=work_date,
                type_of_day="Working" if i % 4 != 3 else "HalfDay",
                hours_worked=8.0 if i % 4 != 3 else 4.0,
                comments=f"Day {i+1} work" if i % 3 == 0 else None,
                status=status,
                manager_reason="Good work!" if status == "Approved" else ("Incomplete hours" if status == "Denied" else None),
                updated_at=work_date,
            ))

        db.add_all(entries)
        db.flush()

        # ── Month Locks ──
        db.add_all([
            MonthLock(year=2026, month=1, locked_by="mock-user-admin"),
            MonthLock(year=2026, month=2, locked_by="mock-user-admin"),
        ])

        # ── Notifications ──
        notifs = []
        for uid in ["mock-user-raj-kumar", "mock-user-admin"]:
            notifs.extend([
                Notification(
                    user_id=uid,
                    title="Timesheet Approved",
                    message="Your entry for 15 Mar 2026 has been approved.",
                    type="approval",
                    is_read=False,
                ),
                Notification(
                    user_id=uid,
                    title="Timesheet Denied",
                    message="Your entry for 10 Mar 2026 was denied. Reason: Incomplete hours",
                    type="denial",
                    is_read=False,
                ),
                Notification(
                    user_id=uid,
                    title="Month Locked",
                    message="February 2026 has been locked by admin.",
                    type="lock",
                    is_read=True,
                ),
                Notification(
                    user_id=uid,
                    title="Client Approved Your Timesheet",
                    message="Your timesheet submitted to Acme Corp was approved by John Smith.",
                    type="client_approved",
                    is_read=False,
                ),
                Notification(
                    user_id=uid,
                    title="Reminder",
                    message="Please submit your timesheet for this week.",
                    type="reminder",
                    is_read=True,
                ),
            ])
        db.add_all(notifs)

        # ── Client Submissions ──
        db.add_all([
            ClientSubmission(
                user_id="mock-user-raj-kumar",
                client_name="Acme Corp",
                client_manager_name="John Smith",
                client_manager_email="john.smith@acme.com",
                from_date=datetime(2026, 3, 1),
                to_date=datetime(2026, 3, 31),
                approval_token="token-pending-001",
                cs_status="Pending",
            ),
            ClientSubmission(
                user_id="mock-user-raj-kumar",
                client_name="TechVista Inc",
                client_manager_name="Jane Doe",
                client_manager_email="jane.doe@techvista.com",
                from_date=datetime(2026, 2, 1),
                to_date=datetime(2026, 2, 28),
                approval_token="token-approved-002",
                cs_status="Approved",
                responded_at=datetime(2026, 3, 5),
            ),
        ])

        # ── Holidays ──
        db.add_all([
            Holiday(id="hol-1", name="Republic Day", date=datetime(2026, 1, 26), type="National"),
            Holiday(id="hol-2", name="Holi", date=datetime(2026, 3, 17), type="Festival"),
            Holiday(id="hol-3", name="Independence Day", date=datetime(2026, 8, 15), type="National"),
        ])

        # ── New Hires ──
        db.add_all([
            NewHire(id="nh-1", name="Amit Patel", department="Engineering", joinedAt=datetime(2026, 3, 1)),
            NewHire(id="nh-2", name="Sneha Reddy", department="Design", joinedAt=datetime(2026, 3, 15)),
        ])

        # ── Anniversaries ──
        db.add_all([
            Anniversary(id="ann-1", name="Raj Kumar", type="BIRTHDAY", date=datetime(2026, 4, 10)),
            Anniversary(id="ann-2", name="Priya Sharma", type="WORK_ANNIVERSARY", date=datetime(2026, 4, 15)),
        ])

        db.commit()
        print("✓ Seed complete: 2 users, timesheets, notifications, holidays, locks, submissions")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
