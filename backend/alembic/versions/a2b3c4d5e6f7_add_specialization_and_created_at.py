"""add specialization to users and created_at to timesheets

Revision ID: a2b3c4d5e6f7
Revises: 131f6e5f7c46
Create Date: 2026-04-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, None] = '131f6e5f7c46'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'users' in tables:
        existing = [c['name'] for c in inspector.get_columns('users')]
        if 'specialization' not in existing:
            op.add_column('users', sa.Column('specialization', sa.String(), nullable=True))

    if 'timesheets' in tables:
        existing = [c['name'] for c in inspector.get_columns('timesheets')]
        if 'created_at' not in existing:
            op.add_column('timesheets', sa.Column('created_at', sa.DateTime(), nullable=True))
            op.execute("UPDATE timesheets SET created_at = updated_at WHERE created_at IS NULL")


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'timesheets' in tables:
        existing = [c['name'] for c in inspector.get_columns('timesheets')]
        if 'created_at' in existing:
            op.drop_column('timesheets', 'created_at')

    if 'users' in tables:
        existing = [c['name'] for c in inspector.get_columns('users')]
        if 'specialization' in existing:
            op.drop_column('users', 'specialization')
