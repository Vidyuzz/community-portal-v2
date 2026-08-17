"""
One-off leave-balance backfill.

Leave and half-day entries created before leave deduction existed were never
debited, so stored balances are overstated by the leave already taken. This
recomputes every user's balance as:

    new_balance = current_balance - sum(cost of their existing leave entries)

Run from backend/:
    python -m scripts.recalc_leave            # dry run, prints what would change
    python -m scripts.recalc_leave --apply    # writes the new balances

WARNING: this is a ONE-OFF. Running it twice double-deducts, because entries
created after the fix have already been debited at save time.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.timesheet import Timesheet  # noqa: E402
from app.routers.timesheets import _leave_cost  # noqa: E402


def recalc(apply: bool) -> None:
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.name).all()
        print(f"{'Employee':<24} {'Current':>9} {'Used':>7} {'New':>9}")
        print("-" * 52)

        changed = 0
        for u in users:
            entries = db.query(Timesheet).filter(Timesheet.user_id == u.id).all()
            used = round(sum(_leave_cost(e.type_of_day) for e in entries), 2)
            current = u.leave_balance or 0.0
            new_balance = round(max(0.0, current - used), 2)

            flag = ""
            if current - used < 0:
                flag = f"  (clamped from {round(current - used, 2)})"
            if new_balance != current:
                changed += 1
            print(f"{u.name:<24} {current:>9} {used:>7} {new_balance:>9}{flag}")

            if apply:
                u.leave_balance = new_balance

        if apply:
            db.commit()
            print(f"\n✓ Applied — {changed} balance(s) updated.")
        else:
            print(f"\nDry run — {changed} balance(s) would change. Re-run with --apply to write.")
    finally:
        db.close()


if __name__ == "__main__":
    recalc(apply="--apply" in sys.argv)
