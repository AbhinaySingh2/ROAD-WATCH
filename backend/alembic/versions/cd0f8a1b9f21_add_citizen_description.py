"""add_citizen_description

Revision ID: cd0f8a1b9f21
Revises: bf07e92699fd
Create Date: 2026-05-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "cd0f8a1b9f21"
down_revision: Union[str, Sequence[str], None] = "bf07e92699fd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("reports", sa.Column("citizen_description", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("reports", "citizen_description")

