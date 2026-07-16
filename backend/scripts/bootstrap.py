"""
Deploy-time bootstrap — safe to run on every start.

  1. Ensures the schema exists (idempotent create_all; complements `alembic upgrade head`).
  2. Seeds the demo dataset ONLY if the database has no users yet.

Because it seeds conditionally, restarts and redeploys never wipe data — anything entered
during the demo survives. To force a clean reseed, run `python -m scripts.seed` instead.

Used by the Render start command (see render.yaml):
  alembic upgrade head && python -m scripts.bootstrap && uvicorn app.main:app ...
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import engine, SessionLocal, Base
from app.models import User
from scripts.seed import build


def bootstrap() -> None:
    import app.models  # noqa: F401 — register models on Base.metadata
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            build(db)
            db.commit()
            print("✓ Bootstrap: database was empty — seeded demo data.")
        else:
            print(f"✓ Bootstrap: {user_count} user(s) already present — skipping seed.")
    finally:
        db.close()


if __name__ == "__main__":
    bootstrap()
