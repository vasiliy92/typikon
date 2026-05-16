"""Remove CSY columns, make RU columns required.

Revision ID: 004
Revises: 003
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- saints table ---
    # Make name_ru NOT NULL (was nullable)
    op.alter_column("saints", "name_ru", existing_type=sa.String(500), nullable=False)
    # Drop CSY columns
    op.drop_column("saints", "name_csy")
    op.drop_column("saints", "name_summary_csy")
    op.drop_column("saints", "life_summary_csy")
    op.drop_column("saints", "troparion_csy")
    op.drop_column("saints", "kontakion_csy")
    # Drop EN columns (no longer supported)
    op.drop_column("saints", "name_en")
    op.drop_column("saints", "life_summary_en")
    op.drop_column("saints", "troparion_en")
    op.drop_column("saints", "kontakion_en")

    # --- calendar_entries table ---
    # Make title_ru NOT NULL (was nullable)
    op.alter_column("calendar_entries", "title_ru", existing_type=sa.String(500), nullable=False)
    # Drop CSY/EN columns
    op.drop_column("calendar_entries", "title_csy")
    op.drop_column("calendar_entries", "title_en")


def downgrade() -> None:
    # --- calendar_entries ---
    op.add_column("calendar_entries", sa.Column("title_en", sa.String(500), nullable=True))
    op.add_column("calendar_entries", sa.Column("title_csy", sa.String(500), nullable=True))
    op.alter_column("calendar_entries", "title_ru", existing_type=sa.String(500), nullable=True)

    # --- saints ---
    op.add_column("saints", sa.Column("kontakion_en", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("troparion_en", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("life_summary_en", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("name_en", sa.String(500), nullable=True))
    op.add_column("saints", sa.Column("kontakion_csy", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("troparion_csy", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("life_summary_csy", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("name_csy", sa.String(500), nullable=True))
    op.alter_column("saints", "name_ru", existing_type=sa.String(500), nullable=True)