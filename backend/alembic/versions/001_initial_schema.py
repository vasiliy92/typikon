"""initial schema

Revision ID: 001
Revises:
Create Date: 2025-05-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Saints (no FK dependencies) ---
    op.create_table('saints',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('slug', sa.String(length=120), nullable=False),
        sa.Column('name_csy', sa.String(length=500), nullable=False),
        sa.Column('name_fr', sa.String(length=500), nullable=True),
        sa.Column('name_en', sa.String(length=500), nullable=True),
        sa.Column('life_summary_csy', sa.Text(), nullable=True),
        sa.Column('life_summary_fr', sa.Text(), nullable=True),
        sa.Column('life_summary_en', sa.Text(), nullable=True),
        sa.Column('icon_url', sa.String(length=500), nullable=True),
        sa.Column('icon_thumbnail_url', sa.String(length=500), nullable=True),
        sa.Column('categories', sa.Text(), nullable=True),
        sa.Column('reposed_year', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_saints_slug', 'saints', ['slug'], unique=True)

    # --- Service Templates (no FK dependencies) ---
    op.create_table('service_templates',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('service_type', sa.String(length=20), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('sub_type', sa.String(length=50), nullable=True),
        sa.Column('is_special', sa.Boolean(), nullable=False),
        sa.Column('trigger_condition', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- Temples (depends on saints) ---
    op.create_table('temples',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('dedication_type', sa.String(length=20), nullable=False),
        sa.Column('patron_feast_month', sa.Integer(), nullable=True),
        sa.Column('patron_feast_day', sa.Integer(), nullable=True),
        sa.Column('patronsaint_id', sa.Integer(), nullable=True),
        sa.Column('calendar_mode', sa.String(length=20), nullable=False),
        sa.Column('language', sa.String(length=5), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['patronsaint_id'], ['saints.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- Side Chapels (depends on temples) ---
    op.create_table('side_chapels',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('temple_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('dedication_type', sa.String(length=20), nullable=False),
        sa.Column('patron_feast_month', sa.Integer(), nullable=True),
        sa.Column('patron_feast_day', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['temple_id'], ['temples.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- Assembled Services (depends on temples) ---
    op.create_table('assembled_services',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('service_date', sa.Date(), nullable=False),
        sa.Column('service_type', sa.String(length=20), nullable=False),
        sa.Column('temple_id', sa.Integer(), nullable=False),
        sa.Column('language', sa.String(length=5), nullable=False),
        sa.Column('calendar_style', sa.String(length=10), nullable=False),
        sa.Column('content_json', sa.Text(), nullable=False),
        sa.Column('ustav_json', sa.Text(), nullable=True),
        sa.Column('is_valid', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['temple_id'], ['temples.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_assembled_services_lookup', 'assembled_services',
        ['service_date', 'service_type', 'temple_id', 'language', 'calendar_style'], unique=True)

    # --- Calendar Entries (depends on saints, service_templates) ---
    op.create_table('calendar_entries',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('date_type', sa.String(length=10), nullable=False),
        sa.Column('month', sa.Integer(), nullable=True),
        sa.Column('day', sa.Integer(), nullable=True),
        sa.Column('pascha_offset', sa.Integer(), nullable=True),
        sa.Column('title_csy', sa.String(length=500), nullable=False),
        sa.Column('title_fr', sa.String(length=500), nullable=True),
        sa.Column('title_en', sa.String(length=500), nullable=True),
        sa.Column('saint_id', sa.Integer(), nullable=True),
        sa.Column('rank', sa.String(length=2), nullable=False),
        sa.Column('tone', sa.Integer(), nullable=True),
        sa.Column('fasting', sa.String(length=20), nullable=False),
        sa.Column('forefeast_days', sa.Integer(), nullable=False),
        sa.Column('afterfeast_days', sa.Integer(), nullable=False),
        sa.Column('service_template_id', sa.Integer(), nullable=True),
        sa.Column('rubric', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['saint_id'], ['saints.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['service_template_id'], ['service_templates.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_calendar_entries_fixed', 'calendar_entries', ['month', 'day'])
    op.create_index('ix_calendar_entries_movable', 'calendar_entries', ['pascha_offset'])

    # --- Service Blocks (no FK dependencies) ---
    op.create_table('service_blocks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('book_code', sa.String(length=30), nullable=False),
        sa.Column('location_key', sa.String(length=120), nullable=False),
        sa.Column('slot', sa.String(length=80), nullable=False),
        sa.Column('slot_order', sa.Integer(), nullable=False),
        sa.Column('language', sa.String(length=5), nullable=False),
        sa.Column('translation_group_id', sa.String(length=36), nullable=True),
        sa.Column('title', sa.String(length=500), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tone', sa.String(length=2), nullable=True),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.Column('is_doxastikon', sa.Boolean(), nullable=False),
        sa.Column('is_theotokion', sa.Boolean(), nullable=False),
        sa.Column('is_irmos', sa.Boolean(), nullable=False),
        sa.Column('is_katabasia', sa.Boolean(), nullable=False),
        sa.Column('source_ref', sa.String(length=200), nullable=True),
        sa.Column('rubric', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_service_blocks_location', 'service_blocks', ['book_code', 'location_key', 'language'])

    # --- Service Template Blocks (depends on service_templates) ---
    op.create_table('service_template_blocks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('block_order', sa.Integer(), nullable=False),
        sa.Column('slot_key', sa.String(length=80), nullable=False),
        sa.Column('block_type', sa.String(length=20), nullable=False),
        sa.Column('fixed_content_key', sa.String(length=120), nullable=True),
        sa.Column('variable_sources', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('required', sa.Boolean(), nullable=False),
        sa.Column('rubric', sa.Text(), nullable=True),
        sa.Column('typikon_ref', sa.String(length=50), nullable=True),
        sa.Column('condition', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['template_id'], ['service_templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- Special Service Content (depends on service_templates) ---
    op.create_table('special_service_content',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('block_order', sa.Integer(), nullable=False),
        sa.Column('slot_key', sa.String(length=80), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('rubric', sa.Text(), nullable=True),
        sa.Column('language', sa.String(length=5), nullable=False),
        sa.Column('variable_slots', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['template_id'], ['service_templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- Lections (no FK dependencies) ---
    op.create_table('lections',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('book_code', sa.String(length=30), nullable=False),
        sa.Column('zachalo', sa.Integer(), nullable=False),
        sa.Column('language', sa.String(length=5), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('short_ref', sa.String(length=200), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_lections_book_zachalo', 'lections', ['book_code', 'zachalo', 'language'], unique=True)

    # --- Lection Assignments (no FK dependencies) ---
    op.create_table('lection_assignments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('service_type', sa.String(length=20), nullable=False),
        sa.Column('moveable_key', sa.String(length=100), nullable=True),
        sa.Column('fixed_month', sa.Integer(), nullable=True),
        sa.Column('fixed_day', sa.Integer(), nullable=True),
        sa.Column('lection_book', sa.String(length=30), nullable=False),
        sa.Column('zachalo', sa.Integer(), nullable=False),
        sa.Column('reading_order', sa.Integer(), nullable=False),
        sa.Column('is_paremia', sa.Boolean(), nullable=False),
        sa.Column('language', sa.String(length=5), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_lection_assignments_moveable', 'lection_assignments', ['moveable_key', 'service_type'])
    op.create_index('ix_lection_assignments_fixed', 'lection_assignments', ['fixed_month', 'fixed_day', 'service_type'])

    # --- Kathisma Rules (no FK dependencies) ---
    op.create_table('kathisma_rules',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('period', sa.String(length=50), nullable=False),
        sa.Column('day_of_week', sa.Integer(), nullable=False),
        sa.Column('service_type', sa.String(length=20), nullable=False),
        sa.Column('kathismata', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    # --- Markov Rules (no FK dependencies) ---
    op.create_table('markov_rules',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('rule_key', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('conditions', sa.Text(), nullable=False),
        sa.Column('overrides', sa.Text(), nullable=False),
        sa.Column('typikon_ref', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_markov_rules_key', 'markov_rules', ['rule_key'], unique=True)


def downgrade() -> None:
    op.drop_table('markov_rules')
    op.drop_table('kathisma_rules')
    op.drop_table('lection_assignments')
    op.drop_table('lections')
    op.drop_table('special_service_content')
    op.drop_table('service_template_blocks')
    op.drop_table('service_blocks')
    op.drop_table('calendar_entries')
    op.drop_table('assembled_services')
    op.drop_table('side_chapels')
    op.drop_table('temples')
    op.drop_table('service_templates')
    op.drop_table('saints')
