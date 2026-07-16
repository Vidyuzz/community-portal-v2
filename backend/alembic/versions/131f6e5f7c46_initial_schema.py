"""initial_schema

Revision ID: 131f6e5f7c46
Revises:
Create Date: 2026-04-04 20:14:30.854495

Builds the full base schema from the SQLAlchemy models. This migration was originally
committed as an empty stub, which meant `alembic upgrade head` created zero tables and the
schema only ever existed because someone ran `scripts/seed.py` (create_all) by hand — the
root cause of the production outage. We rebuild it from `Base.metadata` so the schema always
matches the models exactly. `create_all`/`drop_all` are idempotent (checkfirst), so this is
safe on a fresh database and on one whose tables were previously created by create_all.

NOTE: subsequent schema changes must be their own migrations — do not rely on this one picking
up new columns. The follow-up migration a2b3c4d5e6f7 adds `specialization`/`created_at`; it is
guarded, so it is a no-op when this migration already created those columns.
"""
from typing import Sequence, Union

from alembic import op

from app.database import Base
import app.models  # noqa: F401 — register every model on Base.metadata


# revision identifiers, used by Alembic.
revision: str = '131f6e5f7c46'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
