"""Add Russian language fields and saint troparia/kontakia

Revision ID: 003
Revises: 002
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("calendar_entries", sa.Column("title_ru", sa.String(500), nullable=True))
    op.add_column("saints", sa.Column("name_ru", sa.String(500), nullable=True))
    op.add_column("saints", sa.Column("life_summary_ru", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("troparion_csy", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("troparion_fr", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("troparion_en", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("troparion_ru", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("troparion_tone", sa.String(10), nullable=True))
    op.add_column("saints", sa.Column("kontakion_csy", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("kontakion_fr", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("kontakion_en", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("kontakion_ru", sa.Text, nullable=True))
    op.add_column("saints", sa.Column("kontakion_tone", sa.String(10), nullable=True))


def downgrade() -> None:
    op.drop_column("calendar_entries", "title_ru")
    op.drop_column("saints", "name_ru")
    op.drop_column("saints", "life_summary_ru")
    op.drop_column("saints", "troparion_csy")
    op.drop_column("saints", "troparion_fr")
    op.drop_column("saints", "troparion_en")
    op.drop_column("saints", "troparion_ru")
    op.drop_column("saints", "troparion_tone")
    op.drop_column("saints", "kontakion_csy")
    op.drop_column("saints", "kontakion_fr")
    op.drop_column("saints", "kontakion_en")
    op.drop_column("saints", "kontakion_ru")
    op.drop_column("saints", "kontakion_tone")
