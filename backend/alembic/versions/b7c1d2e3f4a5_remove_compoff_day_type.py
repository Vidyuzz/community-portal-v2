"""remove CompOff from the daytype enum

The client dropped comp-off in the 17 Aug review ("comp-off won't be that
helpful"), so the day type goes with it. Production had zero CompOff rows at
the time of writing; any that exist elsewhere become Leave, since comp-off was
a day not worked. Balances are not recomputed — comp-off never cost anything.

Revision ID: b7c1d2e3f4a5
Revises: a2b3c4d5e6f7
Create Date: 2026-08-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7c1d2e3f4a5'
down_revision: Union[str, None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OLD = ('Working', 'Leave', 'Holiday', 'HalfDay', 'CompOff')
NEW = ('Working', 'Leave', 'Holiday', 'HalfDay')


def _enum_has(conn, label: str) -> bool:
    """Whether the daytype enum currently carries this label (Postgres only)."""
    return conn.execute(
        sa.text(
            "select 1 from pg_type t join pg_enum e on e.enumtypid = t.oid "
            "where t.typname = 'daytype' and e.enumlabel = :label"
        ),
        {"label": label},
    ).first() is not None


def _rebuild_enum(values: Sequence[str]) -> None:
    """Postgres cannot drop a value from an enum — swap in a fresh type."""
    labels = ", ".join(f"'{v}'" for v in values)
    op.execute("ALTER TYPE daytype RENAME TO daytype_old")
    op.execute(f"CREATE TYPE daytype AS ENUM ({labels})")
    op.execute("ALTER TABLE timesheets ALTER COLUMN type_of_day DROP DEFAULT")
    op.execute(
        "ALTER TABLE timesheets ALTER COLUMN type_of_day "
        "TYPE daytype USING type_of_day::text::daytype"
    )
    op.execute("DROP TYPE daytype_old")


def upgrade() -> None:
    conn = op.get_bind()
    if 'timesheets' not in sa.inspect(conn).get_table_names():
        return

    is_pg = conn.dialect.name == 'postgresql'
    # On a fresh database the initial migration builds the enum straight from
    # the models, which no longer contain CompOff — so there is nothing to
    # remove. Comparing a column to a label the enum does not have is a hard
    # error in Postgres, not an empty match, so this guard is required.
    if is_pg and not _enum_has(conn, 'CompOff'):
        return

    op.execute("UPDATE timesheets SET type_of_day = 'Leave' WHERE type_of_day = 'CompOff'")

    if is_pg:
        _rebuild_enum(NEW)
    # sqlite stores this as VARCHAR with a CHECK constraint and needs a full
    # table rebuild to alter it. Local dev databases are recreated from the
    # models by scripts/seed.py, so the data update above is enough there.


def downgrade() -> None:
    conn = op.get_bind()
    if 'timesheets' not in sa.inspect(conn).get_table_names():
        return

    if conn.dialect.name == 'postgresql' and not _enum_has(conn, 'CompOff'):
        _rebuild_enum(OLD)
    # Rows converted to Leave on the way up are not restored — the original
    # CompOff/Leave distinction is not recoverable from the data.
