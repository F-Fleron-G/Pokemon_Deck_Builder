"""Added image_url column to Pokemon table

Revision ID: 9c4777fd0b4b
Revises: 
Create Date: 2025-02-22 16:23:23.518594

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c4777fd0b4b'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('pokemon', sa.Column('image_url', sa.String(), nullable=True))
    op.drop_column('pokemon', 'tcg_set')
    op.drop_column('pokemon', 'tcg_image_url')
    op.drop_column('pokemon', 'tcg_id')
    op.drop_column('pokemon', 'tcg_rarity')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('pokemon', sa.Column('tcg_rarity', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('pokemon', sa.Column('tcg_id', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('pokemon', sa.Column('tcg_image_url', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('pokemon', sa.Column('tcg_set', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.drop_column('pokemon', 'image_url')
    # ### end Alembic commands ###
